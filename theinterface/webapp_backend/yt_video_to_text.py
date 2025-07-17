import yt_dlp


url = "https://www.youtube.com/watch?v=fu3645D4ZlI"

ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': 'downloaded_audio.%(ext)s',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'ffmpeg_location': r'G:/ffmpeg-2025-03-13-git-958c46800e-full_build/ffmpeg-2025-03-13-git-958c46800e-full_build/bin',
}
                                                                                                                                    
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([url])


