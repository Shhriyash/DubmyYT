import os
import yt_dlp
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from google.cloud import translate_v2 as translate
from groq import Groq
from dotenv import load_dotenv
import srt
from datetime import timedelta
from pydub import AudioSegment
import asyncio
from concurrent.futures import ThreadPoolExecutor
from supabase import create_client, Client
import hashlib
import json
import logging
import re
from datetime import datetime, timedelta as dt_timedelta
import base64
import requests

# ---------- ENV & API KEYS ----------
# Load environment variables
load_dotenv(override=True)
groq_key = os.getenv('groqclient', '').split(',')[0].strip()

# Set Google Application Credentials from environment or default filename
google_creds_file = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'indiapost-439216-6a03ba3d322b.json')
# Use absolute path relative to current script directory
google_creds_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), google_creds_file)
if os.path.exists(google_creds_path):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_creds_path
else:
    print(f"Warning: Google credentials file not found at {google_creds_path}")

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow requests from any origin (for tunneling support)
CORS(app, 
     origins="*",  # Allow all origins for tunneling
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-User-Id"],
     supports_credentials=True
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

translate_client = translate.Client()

# ---------- SUPABASE CONFIG ----------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- LOGGING ----------
logging.basicConfig(filename="server.log", level=logging.INFO)

# ---------- CORS PREFLIGHT HANDLER ----------
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-User-Id")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

# ---------- RATE LIMITING ----------
rate_limit_cache = {}

def is_valid_uuid(uuid):
    return bool(re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", uuid, re.I))

def check_user_exists(user_id):
    # Add basic user validation since RLS is disabled
    if not user_id or not is_valid_uuid(user_id):
        return False
    return True


def rate_limit(user_id, limit=10, window_sec=60):
    now = datetime.utcnow()
    window_start = now - dt_timedelta(seconds=window_sec)
    if user_id not in rate_limit_cache:
        rate_limit_cache[user_id] = []
    # Remove old timestamps
    rate_limit_cache[user_id] = [t for t in rate_limit_cache[user_id] if t > window_start]
    if len(rate_limit_cache[user_id]) >= limit:
        return False
    rate_limit_cache[user_id].append(now)
    return True

# ---------- AUDIO CHUNKING UTILS ----------

def preprocess_audio(input_path):
    """Convert input audio to 16kHz mono FLAC for Whisper."""
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_frame_rate(16000).set_channels(1)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".flac")
    audio.export(temp_file.name, format="flac")
    return temp_file.name

def split_audio_chunks(input_path, chunk_duration=60):
    """
    Split audio into chunks of chunk_duration seconds.
    Returns list of (chunk_path, index, chunk_start_sec).
    """
    audio = AudioSegment.from_file(input_path)
    chunks = []
    for i in range(0, len(audio), chunk_duration * 1000):
        chunk = audio[i:i + chunk_duration * 1000]
        temp_chunk = tempfile.NamedTemporaryFile(delete=False, suffix=".flac")
        chunk.export(temp_chunk.name, format="flac")
        chunk_start_sec = i // 1000
        chunk_index = len(chunks)
        chunks.append((temp_chunk.name, chunk_index, chunk_start_sec))
    return chunks

def transcribe_chunk_sync(chunk_path, language_hint="en", chunk_start_sec=0):
    """
    Synchronous transcription for a single chunk.
    Adjust segment start/end times by chunk_start_sec.
    """
    client = Groq(api_key=groq_key)
    try:
        with open(chunk_path, "rb") as file:
            result = client.audio.transcriptions.create(
                file=(chunk_path, file.read()),
                model="whisper-large-v3-turbo",
                response_format="verbose_json",
                language=language_hint
            )
            # Adjust segment times
            for seg in result.segments:
                seg['start'] += chunk_start_sec
                seg['end'] += chunk_start_sec
            return result.segments
    except Exception as e:
        logging.error(f"Transcription failed for {chunk_path}: {e}")
        return []

async def transcribe_chunk(chunk_path, index, chunk_start_sec, language_hint="en", executor=None):
    """
    Async wrapper for transcribing a chunk using ThreadPoolExecutor.
    """
    loop = asyncio.get_event_loop()
    segments = await loop.run_in_executor(executor, transcribe_chunk_sync, chunk_path, language_hint, chunk_start_sec)
    return (index, segments)

async def transcribe_all_chunks(chunk_infos, language_hint="en"):
    """
    Transcribe all chunks concurrently using asyncio and ThreadPoolExecutor.
    Returns list of (index, segments).
    """
    executor = ThreadPoolExecutor()
    tasks = [
        transcribe_chunk(chunk_path, idx, chunk_start_sec, language_hint, executor)
        for chunk_path, idx, chunk_start_sec in chunk_infos
    ]
    results = await asyncio.gather(*tasks)
    executor.shutdown(wait=True)
    return results

def merge_transcriptions(transcriptions):
    """
    Merge segments from all chunks, preserving order.
    """
    transcriptions.sort(key=lambda x: x[0])
    merged = []
    for _, segments in transcriptions:
        merged.extend(segments)
    merged.sort(key=lambda seg: seg['start'])
    return merged

def cleanup_temp_files(chunk_infos):
    """Delete temp files after processing."""
    for chunk_path, _, _ in chunk_infos:
        try:
            os.remove(chunk_path)
        except Exception as e:
            logging.warning(f"Failed to delete temp file {chunk_path}: {e}")

# ---------- CORE FUNCTIONS ----------

def download_audio(youtube_url):
    """Download audio from YouTube and return file path."""
    for file in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, file)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            logging.warning(f"Error cleaning uploads: {e}")

    # Try multiple approaches for downloading
    approaches = [
        # Primary approach with anti-bot measures
        {
            'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': 'https://www.youtube.com/',
            'sleep_interval': 1,
            'max_sleep_interval': 3,
            'extractor_retries': 3,
            'file_access_retries': 3,
        },
        # Fallback approach with different format selection
        {
            'format': 'worstaudio/worst',
            'user_agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'sleep_interval': 2,
            'extractor_retries': 2,
        },
        # Last resort - any available format
        {
            'format': 'best/worst',
            'user_agent': 'yt-dlp/2025.02.19',
            'extractor_retries': 1,
        }
    ]
    
    last_error = None
    
    for i, approach in enumerate(approaches):
        try:
            ydl_opts = {
                'outtmpl': os.path.join(UPLOAD_FOLDER, 'downloaded_audio.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'ffmpeg_location': r'G:/ffmpeg-2025-03-13-git-958c46800e-full_build/ffmpeg-2025-03-13-git-958c46800e-full_build/bin',
                'noplaylist': True,
                'quiet': True,
                'no_warnings': True,
                'extract_flat': False,
                'ignoreerrors': False,
                **approach
            }

            logging.info(f"Attempting YouTube download with approach {i+1}/3")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([youtube_url])
            
            # If we get here, download was successful
            output_file = os.path.join(UPLOAD_FOLDER, "downloaded_audio.mp3")
            if os.path.exists(output_file):
                logging.info(f"YouTube download successful with approach {i+1}")
                return output_file
            else:
                # File might have different extension, look for any downloaded file
                for file in os.listdir(UPLOAD_FOLDER):
                    if file.startswith('downloaded_audio'):
                        logging.info(f"Found downloaded file: {file}")
                        return os.path.join(UPLOAD_FOLDER, file)
                        
        except Exception as e:
            last_error = e
            logging.warning(f"Approach {i+1} failed: {str(e)}")
            continue
    
    # If all approaches failed, raise the last error
    if last_error:
        error_msg = str(last_error)
        if "HTTP Error 403" in error_msg or "Forbidden" in error_msg:
            raise Exception("YouTube download blocked due to anti-bot protection. This video may be restricted or region-locked. Please try a different video or try again later.")
        elif "Requested format is not available" in error_msg:
            raise Exception("Video format not available. YouTube may have changed format restrictions for this video. Please try a different video.")
        elif "Video unavailable" in error_msg or "Private video" in error_msg:
            raise Exception("This video is unavailable, private, or has been removed. Please check the URL and try again.")
        else:
            raise Exception(f"Failed to download video after trying multiple approaches: {error_msg}")
    else:
        raise Exception("Failed to download video: Unknown error occurred")

def generate_subtitles_async(filename, language_hint="en"):
    """
    Optimized transcription using a single Groq API key.
    Splits audio into chunks, transcribes in parallel using asyncio.
    Returns all segments in order.
    """
    processed_file = preprocess_audio(filename)
    chunk_infos = split_audio_chunks(processed_file, chunk_duration=60)
    # Run async transcription
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    transcriptions = loop.run_until_complete(transcribe_all_chunks(chunk_infos, language_hint))
    loop.close()
    all_segments = merge_transcriptions(transcriptions)
    cleanup_temp_files(chunk_infos)
    try:
        os.remove(processed_file)
    except Exception as e:
        logging.warning(f"Failed to delete processed file {processed_file}: {e}")
    return all_segments

def groq_summarize(prompt):
    """Summarize text using Groq LLM."""
    client = Groq(api_key=groq_key)
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """You are a helpful assistant that summarizes all of the text covering
                 all the important points. Return the summary in Markdown format.
                 Give the summary directly without any additional text or explanation."""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=1024,
        top_p=1
    )
    return completion.choices[0].message.content

def format_srt(segments, target_language=None):
    """Format segments as SRT subtitles, optionally translating."""
    subtitles = []
    for i, seg in enumerate(segments):
        start = timedelta(seconds=seg['start'])
        end = timedelta(seconds=seg['end'])
        text = seg['text'].strip()

        if target_language:
            text = translate_text(text, target_language)

        subtitles.append(srt.Subtitle(index=i+1, start=start, end=end, content=text))

    return srt.compose(subtitles)

def translate_text(text, target_language):
    """Translate text using Google Translate API."""
    result = translate_client.translate(text, target_language=target_language, format_="text")
    return result["translatedText"]

def get_user_id():
    """
    Get current user's UUID from header.
    """
    return request.headers.get("X-User-Id")

def hash_file(filepath):
    """
    Return SHA256 hash of file for unique identification.
    """
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def get_youtube_title(youtube_url):
    """Fetch YouTube video title using yt-dlp."""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            # Anti-bot measures for title extraction
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': 'https://www.youtube.com/',
            'sleep_interval': 1,
            'max_sleep_interval': 2,
            'extractor_retries': 2,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            return info.get('title', 'Untitled YouTube Video')
    except Exception as e:
        logging.error(f"Failed to fetch YouTube title: {e}")
        return 'YouTube Video'

def get_or_create_video_id(video_url, user_id, is_uploaded=False, file_hash=None):
    """
    Check if Video_url row exists for user/video.
    If not, upsert and return id. Also fetch YouTube title if it's a YouTube URL.
    """
    
    if is_uploaded:
        video_url = file_hash
        title = "Uploaded File"
    else:
        # Fetch YouTube title
        title = get_youtube_title(video_url)
    
    try:
        # Upsert to avoid duplicates
        query = supabase.table("video_url").select("id").eq("video_url", video_url).eq("user_id", user_id).execute()
        if query.data:
            # Update title if it's still "Untitled"
            existing_id = query.data[0]["id"]
            supabase.table("video_url").update({"title": title}).eq("id", existing_id).execute()
            return existing_id
        # Insert new row with fetched title
        insert = supabase.table("video_url").upsert({
            "video_url": video_url,
            "user_id": user_id,
            "title": title
        }).execute()
        return insert.data[0]["id"]
    except Exception as e:
        logging.error(f"Database error in get_or_create_video_id: {str(e)}")
        raise e

def upsert_transcript(video_id, language, segments, user_id):
    """
    Insert or update transcript for video/language.
    Store as JSON. Always include user_id.
    """
    supabase.table("transcripts").upsert({
        "video_id": video_id,
        "language": language,
        "text": json.dumps(segments),
        "user_id": user_id
    }).execute()

def get_transcript(video_id, language):
    """
    Check for existing transcript for video/language.
    """
    query = supabase.table("transcripts").select("text").eq("video_id", video_id).eq("language", language).execute()
    if query.data:
        return query.data[0]["text"]
    return None

def upsert_summary(video_id, summary, user_id):
    """
    Insert or update summary for video.
    Always include user_id.
    """
    supabase.table("summaries").upsert({
        "video_id": video_id,
        "summary": summary,
        "user_id": user_id
    }).execute()

def upsert_subtitle(video_id, language, srt, user_id):
    """
    Insert or update subtitle for video/language.
    Always include user_id.
    """
    supabase.table("subtitles").upsert({
        "video_id": video_id,
        "language": language,
        "srt": srt,
        "user_id": user_id
    }).execute()

def get_summary(video_id):
    """
    Check for existing summary for video.
    """
    query = supabase.table("summaries").select("summary").eq("video_id", video_id).execute()
    if query.data:
        return query.data[0]["summary"]
    return None

def set_supabase_auth_context(user_id):
    """
    Auth context setting removed since RLS is disabled.
    """
    pass

# ---------- ANALYTICS FUNCTIONS ----------

def initialize_user_analytics(user_id):
    """
    Initialize analytics entry for a new user if it doesn't exist.
    """
    try:
        query = supabase.table("user_analytics").select("user_id").eq("user_id", user_id).execute()
        if not query.data:
            supabase.table("user_analytics").insert({
                "user_id": user_id,
                "videos_processed": 0,
                "summaries_generated": 0,
                "subtitles_generated": 0,
                "languages_used": [],
                "total_processing_time": 0,
                "last_activity": datetime.utcnow().isoformat()
            }).execute()
    except Exception as e:
        logging.error(f"Error initializing user analytics: {e}")

def track_user_activity(user_id, activity_type, video_id=None, language=None, processing_time=0):
    """
    Track user activity in the activity log and update analytics.
    
    activity_type: 'video_processed', 'summary_generated', 'subtitle_generated'
    """
    try:
        # Initialize user analytics if not exists
        initialize_user_analytics(user_id)
        
        # Log the activity
        supabase.table("user_activity_log").insert({
            "user_id": user_id,
            "activity_type": activity_type,
            "video_id": video_id,
            "language": language,
            "processing_time": processing_time
        }).execute()
        
        # Update user analytics
        update_user_analytics(user_id, activity_type, language, processing_time)
        
        # Update daily stats
        update_daily_usage_stats(user_id, activity_type, language, processing_time)
        
    except Exception as e:
        logging.error(f"Error tracking user activity: {e}")

def update_user_analytics(user_id, activity_type, language=None, processing_time=0):
    """
    Update user analytics counters and metadata.
    """
    try:
        # Get current analytics
        query = supabase.table("user_analytics").select("*").eq("user_id", user_id).execute()
        if not query.data:
            initialize_user_analytics(user_id)
            query = supabase.table("user_analytics").select("*").eq("user_id", user_id).execute()
        
        current_data = query.data[0]
        languages_used = current_data.get("languages_used", [])
        
        # Add new language if not already tracked
        if language and language not in languages_used:
            languages_used.append(language)
        
        # Prepare update data
        update_data = {
            "last_activity": datetime.utcnow().isoformat(),
            "total_processing_time": current_data.get("total_processing_time", 0) + processing_time,
            "languages_used": languages_used
        }
        
        # Increment specific counters
        if activity_type == "video_processed":
            update_data["videos_processed"] = current_data.get("videos_processed", 0) + 1
        elif activity_type == "summary_generated":
            update_data["summaries_generated"] = current_data.get("summaries_generated", 0) + 1
        elif activity_type == "subtitle_generated":
            update_data["subtitles_generated"] = current_data.get("subtitles_generated", 0) + 1
        
        # Update the record
        supabase.table("user_analytics").update(update_data).eq("user_id", user_id).execute()
        
    except Exception as e:
        logging.error(f"Error updating user analytics: {e}")

def update_daily_usage_stats(user_id, activity_type, language=None, processing_time=0):
    """
    Update daily usage statistics for dashboard trends.
    """
    try:
        today = datetime.utcnow().date().isoformat()
        
        # Get or create daily stats
        query = supabase.table("daily_usage_stats").select("*").eq("user_id", user_id).eq("date", today).execute()
        
        if query.data:
            # Update existing record
            current_data = query.data[0]
            languages_today = set(current_data.get("unique_languages", 0))
            if language:
                languages_today.add(language)
            
            update_data = {
                "total_time": current_data.get("total_time", 0) + processing_time,
                "unique_languages": len(languages_today)
            }
            
            if activity_type == "video_processed":
                update_data["videos_count"] = current_data.get("videos_count", 0) + 1
            elif activity_type == "summary_generated":
                update_data["summaries_count"] = current_data.get("summaries_count", 0) + 1
            elif activity_type == "subtitle_generated":
                update_data["subtitles_count"] = current_data.get("subtitles_count", 0) + 1
            
            supabase.table("daily_usage_stats").update(update_data).eq("id", current_data["id"]).execute()
        else:
            # Create new daily record
            insert_data = {
                "user_id": user_id,
                "date": today,
                "videos_count": 1 if activity_type == "video_processed" else 0,
                "summaries_count": 1 if activity_type == "summary_generated" else 0,
                "subtitles_count": 1 if activity_type == "subtitle_generated" else 0,
                "unique_languages": 1 if language else 0,
                "total_time": processing_time
            }
            
            supabase.table("daily_usage_stats").insert(insert_data).execute()
            
    except Exception as e:
        logging.error(f"Error updating daily usage stats: {e}")

def get_user_dashboard_data(user_id):
    """
    Get comprehensive dashboard data for a user.
    """
    try:
        dashboard_data = {}
        
        # Get user analytics
        analytics_query = supabase.table("user_analytics").select("*").eq("user_id", user_id).execute()
        dashboard_data["analytics"] = analytics_query.data[0] if analytics_query.data else {}
        
        # Get recent activity (last 10 activities)
        activity_query = supabase.table("user_activity_log").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(10).execute()
        dashboard_data["recent_activity"] = activity_query.data or []
        
        # Get last 30 days usage trends
        thirty_days_ago = (datetime.utcnow() - dt_timedelta(days=30)).date().isoformat()
        trends_query = supabase.table("daily_usage_stats").select("*").eq("user_id", user_id).gte("date", thirty_days_ago).order("date", desc=False).execute()
        dashboard_data["usage_trends"] = trends_query.data or []
        
        # Calculate achievements
        analytics = dashboard_data["analytics"]
        achievements = []
        
        if analytics.get("videos_processed", 0) >= 1:
            achievements.append({"name": "First Video", "description": "Processed your first video", "icon": "🎬"})
        if analytics.get("videos_processed", 0) >= 10:
            achievements.append({"name": "Video Pro", "description": "Processed 10 videos", "icon": "🏆"})
        if analytics.get("videos_processed", 0) >= 50:
            achievements.append({"name": "Video Master", "description": "Processed 50 videos", "icon": "👑"})
        if len(analytics.get("languages_used", [])) >= 5:
            achievements.append({"name": "Polyglot", "description": "Used 5+ languages", "icon": "🌍"})
        if analytics.get("summaries_generated", 0) >= 25:
            achievements.append({"name": "Summary Expert", "description": "Generated 25 summaries", "icon": "📝"})
        
        dashboard_data["achievements"] = achievements
        
        return dashboard_data
        
    except Exception as e:
        logging.error(f"Error getting dashboard data: {e}")
        return {}

def sync_existing_user_data(user_id):
    """
    Sync existing user data with analytics tables.
    This populates analytics based on existing video_url, summaries, and subtitles data.
    """
    try:
        # Count existing videos for user
        video_query = supabase.table("video_url").select("id").eq("user_id", user_id).execute()
        video_count = len(video_query.data) if video_query.data else 0
        
        # Count existing summaries for user
        summary_query = supabase.table("summaries").select("id").eq("user_id", user_id).execute()
        summary_count = len(summary_query.data) if summary_query.data else 0
        
        # Count existing subtitles and collect languages for user
        subtitle_query = supabase.table("subtitles").select("language").eq("user_id", user_id).execute()
        subtitle_count = len(subtitle_query.data) if subtitle_query.data else 0
        languages_used = list(set([s["language"] for s in subtitle_query.data if s.get("language")])) if subtitle_query.data else []
        
        # Initialize or update user analytics with existing data
        analytics_query = supabase.table("user_analytics").select("user_id").eq("user_id", user_id).execute()
        
        if analytics_query.data:
            # Update existing analytics
            supabase.table("user_analytics").update({
                "videos_processed": video_count,
                "summaries_generated": summary_count,
                "subtitles_generated": subtitle_count,
                "languages_used": languages_used,
                "last_activity": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
        else:
            # Create new analytics entry
            supabase.table("user_analytics").insert({
                "user_id": user_id,
                "videos_processed": video_count,
                "summaries_generated": summary_count,
                "subtitles_generated": subtitle_count,
                "languages_used": languages_used,
                "total_processing_time": 0,
                "last_activity": datetime.utcnow().isoformat()
            }).execute()
        
        logging.info(f"Synced analytics for user {user_id}: {video_count} videos, {summary_count} summaries, {subtitle_count} subtitles")
        return True
        
    except Exception as e:
        logging.error(f"Error syncing user data for {user_id}: {e}")
        return False

# ---------- DEBUG FUNCTION ----------

def debug_supabase_config():
    """Debug function to check Supabase configuration."""
    key = os.getenv("SUPABASE_KEY", "")
    key_type = "unknown"
    
    if key.startswith("eyJ"):  # JWT format
        try:
            # Decode the JWT payload to check the role
            parts = key.split('.')
            if len(parts) >= 2:
                # Add padding if needed
                payload = parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded = base64.b64decode(payload)
                import json
                payload_data = json.loads(decoded)
                role = payload_data.get('role', 'unknown')
                key_type = f"JWT ({role})"
        except Exception as e:
            key_type = "JWT (decode error)"
    
    logging.info(f"Supabase key type: {key_type}")
    print(f"Supabase key type: {key_type}")
    
    if "anon" in key_type:
        print("WARNING: You're using the anon key. Switch to service_role key for server-side applications.")
        logging.warning("Using anon key instead of service_role key")
    elif "service_role" in key_type:
        print("Using service_role key - correct for server-side applications")

# Call debug function on startup
debug_supabase_config()

# ---------- API ROUTE ----------
@app.route("/upload", methods=["POST"])
def upload():
    """
    Accepts file or YouTube URL, processes transcription, subtitles, summary, and translation.
    Uses Supabase to avoid redundant work and manage user video history.
    """
    target_language = request.json.get("language") if request.json else request.form.get("language", "en")
    action = request.json.get("action") if request.json else request.form.get("action", "both")
    user_id = get_user_id()
    video_url = None
    file_hash = None
    is_uploaded = False

    # Validate user_id
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id. Please set X-User-Id header with your UUID."}), 400
    
    # Rate limiting
    if not rate_limit(user_id):
        return jsonify({"error": "Rate limit exceeded. Please wait before making more requests."}), 429

    # Track processing start time
    processing_start_time = datetime.utcnow()

    try:
        # Step 1: Identify video and get video_id
        if request.json and "youtube_url" in request.json:
            video_url = request.json["youtube_url"]
            mp3_file = download_audio(video_url)
        elif "file" in request.files:
            file = request.files["file"]
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
            file.save(file_path)
            mp3_file = file_path
            file_hash = hash_file(file_path)
            is_uploaded = True
        else:
            return jsonify({"error": "No valid input provided"}), 400

        video_id = get_or_create_video_id(video_url, user_id, is_uploaded, file_hash)
        response_data = {}

        # Track video processing
        track_user_activity(user_id, "video_processed", video_id)

        # Step 2: Check for transcript in Supabase (always use original language for transcription)
        original_language = "en"  # Default to English for transcription
        transcript_text = get_transcript(video_id, original_language)
        if transcript_text:
            try:
                segments = json.loads(transcript_text)
            except Exception as e:
                logging.error(f"Failed to parse transcript JSON: {e}")
                segments = []
        else:
            segments = generate_subtitles_async(mp3_file, language_hint=original_language)
            upsert_transcript(video_id, original_language, segments, user_id)

        # Step 3: Check for summary in Supabase
        summary_text = get_summary(video_id)
        if summary_text:
            summarized_text = summary_text
        else:
            text_to_summarize = "\n".join(seg['text'] for seg in segments)
            summarized_text = groq_summarize(f"Please summarize the following text concisely:\n\n{text_to_summarize}")
            upsert_summary(video_id, summarized_text, user_id)
            # Track summary generation
            track_user_activity(user_id, "summary_generated", video_id, target_language)

        # Calculate processing time
        processing_end_time = datetime.utcnow()
        processing_duration = int((processing_end_time - processing_start_time).total_seconds())

        # Step 4: Prepare response and track activities
        if action == "subtitles":
            original_srt = format_srt(segments)
            translated_srt = format_srt(segments, target_language)
            response_data.update({
                "original_subtitles": original_srt,
                "translated_subtitles": translated_srt,
                "target_language": target_language
            })
            # Store subtitles in DB and track activity
            upsert_subtitle(video_id, target_language, translated_srt, user_id)
            track_user_activity(user_id, "subtitle_generated", video_id, target_language, processing_duration)
        elif action == "summarize":
            translated_summary = translate_text(summarized_text, target_language)
            response_data.update({
                "original_summary": summarized_text,
                "translated_summary": translated_summary,
                "target_language": target_language
            })
        else:
            original_srt = format_srt(segments)
            translated_srt = format_srt(segments, target_language)
            translated_summary = translate_text(summarized_text, target_language)
            response_data.update({
                "original_subtitles": original_srt,
                "translated_subtitles": translated_srt,
                "original_summary": summarized_text,
                "translated_summary": translated_summary,
                "target_language": target_language
            })
            # Store subtitles in DB and track activity
            upsert_subtitle(video_id, target_language, translated_srt, user_id)
            track_user_activity(user_id, "subtitle_generated", video_id, target_language, processing_duration)

        return jsonify(response_data)
    except Exception as e:
        logging.error(f"Exception in upload: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/video-details/<int:video_id>", methods=["GET"])
def get_video_details(video_id):
    """
    Get detailed information about a processed video including all available features.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        # Get video info
        video_query = supabase.table("video_url").select("*").eq("id", video_id).eq("user_id", user_id).execute()
        if not video_query.data:
            return jsonify({"error": "Video not found"}), 404
        
        video_info = video_query.data[0]
        
        # Get available transcripts
        transcripts_query = supabase.table("transcripts").select("language").eq("video_id", video_id).execute()
        available_languages = [t["language"] for t in transcripts_query.data] if transcripts_query.data else []
        
        # Get summary
        summary_query = supabase.table("summaries").select("summary").eq("video_id", video_id).execute()
        has_summary = bool(summary_query.data)
        
        # Get subtitles with languages
        subtitles_query = supabase.table("subtitles").select("language").eq("video_id", video_id).execute()
        available_subtitles = [s["language"] for s in subtitles_query.data] if subtitles_query.data else []
        
        return jsonify({
            "video_info": video_info,
            "available_languages": available_languages,
            "has_summary": has_summary,
            "available_subtitles": available_subtitles
        })
        
    except Exception as e:
        logging.error(f"Error getting video details: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/download-subtitle/<int:video_id>/<language>", methods=["GET"])
def download_subtitle(video_id, language):
    """
    Download subtitle file for a specific video and language.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        # Get subtitle content
        subtitle_query = supabase.table("subtitles").select("srt").eq("video_id", video_id).eq("language", language).execute()
        if not subtitle_query.data:
            return jsonify({"error": "Subtitle not found"}), 404
        
        # Get video title for filename
        video_query = supabase.table("video_url").select("title").eq("id", video_id).execute()
        video_title = video_query.data[0]["title"] if video_query.data else "video"
        
        # Clean title for filename
        clean_title = re.sub(r'[^\w\s-]', '', video_title).strip()[:50]
        
        subtitle_content = subtitle_query.data[0]["srt"]
        filename = f"{clean_title}_{language}_subtitles.srt"
        
        return jsonify({
            "content": subtitle_content,
            "filename": filename,
            "content_type": "text/srt"
        })
        
    except Exception as e:
        logging.error(f"Error downloading subtitle: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/download-summary/<int:video_id>", methods=["GET"])
def download_summary(video_id):
    """
    Download summary file for a specific video.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        # Get summary content
        summary_query = supabase.table("summaries").select("summary").eq("video_id", video_id).execute()
        if not summary_query.data:
            return jsonify({"error": "Summary not found"}), 404
        
        # Get video title for filename
        video_query = supabase.table("video_url").select("title").eq("id", video_id).execute()
        video_title = video_query.data[0]["title"] if video_query.data else "video"
        
        # Clean title for filename
        clean_title = re.sub(r'[^\w\s-]', '', video_title).strip()[:50]
        
        summary_content = summary_query.data[0]["summary"]
        filename = f"{clean_title}_summary.txt"
        
        return jsonify({
            "content": summary_content,
            "filename": filename,
            "content_type": "text/plain"
        })
        
    except Exception as e:
        logging.error(f"Error downloading summary: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/user-dashboard", methods=["GET"])
def get_user_dashboard():
    """
    Get comprehensive dashboard data for the authenticated user.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        dashboard_data = get_user_dashboard_data(user_id)
        return jsonify(dashboard_data)
        
    except Exception as e:
        logging.error(f"Error getting user dashboard: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/user-analytics", methods=["GET"])
def get_user_analytics():
    """
    Get user analytics overview.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        # Initialize analytics if not exists
        initialize_user_analytics(user_id)
        
        # Get analytics data
        query = supabase.table("user_analytics").select("*").eq("user_id", user_id).execute()
        analytics_data = query.data[0] if query.data else {}
        
        return jsonify(analytics_data)
        
    except Exception as e:
        logging.error(f"Error getting user analytics: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/user-activity", methods=["GET"])
def get_user_activity():
    """
    Get user activity log with pagination.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100 per page
        offset = (page - 1) * limit
        
        # Get activity log
        query = supabase.table("user_activity_log").select("*").eq("user_id", user_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        activity_data = query.data or []
        
        return jsonify({
            "activities": activity_data,
            "page": page,
            "limit": limit,
            "has_more": len(activity_data) == limit
        })
        
    except Exception as e:
        logging.error(f"Error getting user activity: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/usage-trends", methods=["GET"])
def get_usage_trends():
    """
    Get usage trends over specified period.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        # Get period parameter (default to 30 days)
        days = min(int(request.args.get('days', 30)), 365)  # Max 1 year
        start_date = (datetime.utcnow() - dt_timedelta(days=days)).date().isoformat()
        
        # Get trends data
        query = supabase.table("daily_usage_stats").select("*").eq("user_id", user_id).gte("date", start_date).order("date", desc=False).execute()
        
        trends_data = query.data or []
        
        return jsonify({
            "trends": trends_data,
            "period_days": days,
            "start_date": start_date
        })
        
    except Exception as e:
        logging.error(f"Error getting usage trends: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/sync-user-data", methods=["POST"])
def sync_user_data():
    """
    Sync existing user data with analytics tables.
    This endpoint populates analytics based on existing data.
    """
    user_id = get_user_id()
    
    if not check_user_exists(user_id):
        return jsonify({"error": "Missing or invalid user_id"}), 400
    
    try:
        success = sync_existing_user_data(user_id)
        
        if success:
            # Get updated analytics to return
            query = supabase.table("user_analytics").select("*").eq("user_id", user_id).execute()
            analytics_data = query.data[0] if query.data else {}
            
            return jsonify({
                "message": "User data synced successfully",
                "analytics": analytics_data
            })
        else:
            return jsonify({"error": "Failed to sync user data"}), 500
            
    except Exception as e:
        logging.error(f"Error in sync user data endpoint: {e}")
        return jsonify({"error": str(e)}), 500

# ---------- RUN SERVER ----------
if __name__ == "__main__":
    app.run(debug=True, port=5000)

