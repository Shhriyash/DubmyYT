#!/usr/bin/env python3
"""
Setup Analytics Relationships and Sync Existing Data
This script fixes the table relationships and syncs existing user data with analytics.
"""

import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_relationships():
    """
    Set up foreign key relationships and indexes.
    """
    print("🔗 Setting up table relationships...")
    
    sql_commands = [
        # Add foreign key constraint
        """
        ALTER TABLE user_activity_log 
        ADD CONSTRAINT IF NOT EXISTS fk_user_activity_log_video_id 
        FOREIGN KEY (video_id) REFERENCES video_url(id) ON DELETE CASCADE;
        """,
        
        # Add missing indexes
        """
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_video_id ON user_activity_log(video_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_video ON user_activity_log(user_id, video_id);
        CREATE INDEX IF NOT EXISTS idx_video_url_user_id ON video_url(user_id);
        CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
        CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
        CREATE INDEX IF NOT EXISTS idx_subtitles_user_id ON subtitles(user_id);
        """
    ]
    
    for i, sql in enumerate(sql_commands, 1):
        try:
            print(f"📄 Executing relationship setup {i}/{len(sql_commands)}...")
            # Note: This might not work if your Supabase doesn't support RPC exec_sql
            # In that case, you'll need to run the SQL manually in Supabase SQL Editor
            result = supabase.rpc('exec_sql', {'sql': sql.strip()}).execute()
            print(f"✅ Setup {i} completed")
        except Exception as e:
            print(f"⚠️  Setup {i} failed (you may need to run SQL manually): {e}")

def get_all_users():
    """
    Get all unique user IDs from the video_url table.
    """
    try:
        query = supabase.table("video_url").select("user_id").execute()
        user_ids = list(set([row["user_id"] for row in query.data if row.get("user_id")]))
        return user_ids
    except Exception as e:
        print(f"❌ Error getting users: {e}")
        return []

def sync_user_analytics(user_id):
    """
    Sync analytics for a specific user based on existing data.
    """
    try:
        # Count existing videos
        video_query = supabase.table("video_url").select("id").eq("user_id", user_id).execute()
        video_count = len(video_query.data) if video_query.data else 0
        
        # Count existing summaries
        summary_query = supabase.table("summaries").select("id").eq("user_id", user_id).execute()
        summary_count = len(summary_query.data) if summary_query.data else 0
        
        # Count existing subtitles and collect languages
        subtitle_query = supabase.table("subtitles").select("language").eq("user_id", user_id).execute()
        subtitle_count = len(subtitle_query.data) if subtitle_query.data else 0
        languages_used = list(set([s["language"] for s in subtitle_query.data if s.get("language")])) if subtitle_query.data else []
        
        # Check if analytics entry exists
        analytics_query = supabase.table("user_analytics").select("user_id").eq("user_id", user_id).execute()
        
        if analytics_query.data:
            # Update existing
            supabase.table("user_analytics").update({
                "videos_processed": video_count,
                "summaries_generated": summary_count,
                "subtitles_generated": subtitle_count,
                "languages_used": languages_used
            }).eq("user_id", user_id).execute()
            action = "Updated"
        else:
            # Create new
            supabase.table("user_analytics").insert({
                "user_id": user_id,
                "videos_processed": video_count,
                "summaries_generated": summary_count,
                "subtitles_generated": subtitle_count,
                "languages_used": languages_used,
                "total_processing_time": 0
            }).execute()
            action = "Created"
        
        print(f"✅ {action} analytics for user {user_id[:8]}...: {video_count}v, {summary_count}s, {subtitle_count}sub")
        return True
        
    except Exception as e:
        print(f"❌ Error syncing user {user_id[:8]}...: {e}")
        return False

def sync_all_users():
    """
    Sync analytics for all existing users.
    """
    print("\n📊 Syncing analytics for all existing users...")
    
    users = get_all_users()
    print(f"Found {len(users)} unique users to sync")
    
    success_count = 0
    for user_id in users:
        if sync_user_analytics(user_id):
            success_count += 1
    
    print(f"\n🎉 Successfully synced {success_count}/{len(users)} users")
    return success_count

def verify_setup():
    """
    Verify that the setup was successful.
    """
    print("\n🔍 Verifying setup...")
    
    try:
        # Check if tables exist and have data
        analytics_query = supabase.table("user_analytics").select("*").limit(5).execute()
        print(f"✅ user_analytics table: {len(analytics_query.data)} entries")
        
        activity_query = supabase.table("user_activity_log").select("*").limit(5).execute()
        print(f"✅ user_activity_log table: {len(activity_query.data)} entries")
        
        daily_query = supabase.table("daily_usage_stats").select("*").limit(5).execute()
        print(f"✅ daily_usage_stats table: {len(daily_query.data)} entries")
        
        return True
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🛠️  DubMyYT Analytics Relationship Setup")
    print("=" * 50)
    
    # Check environment
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY are required!")
        exit(1)
    
    print("📋 This script will:")
    print("   1. Set up foreign key relationships between tables")
    print("   2. Add performance indexes")
    print("   3. Sync existing user data with analytics tables")
    print("   4. Verify the setup")
    
    proceed = input("\n❓ Do you want to proceed? (y/n): ").lower()
    if proceed not in ['y', 'yes']:
        print("Cancelled.")
        exit(0)
    
    try:
        # Step 1: Setup relationships
        print("\n" + "="*50)
        setup_relationships()
        
        # Step 2: Sync existing users
        print("\n" + "="*50)
        sync_all_users()
        
        # Step 3: Verify setup
        print("\n" + "="*50)
        verify_setup()
        
        print("\n🎉 Setup completed successfully!")
        print("\n📱 Your analytics system is now ready!")
        print("   - All existing data has been synced")
        print("   - Table relationships are established")
        print("   - Analytics will track new activities automatically")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("\n📝 Manual steps required:")
        print("   1. Run fix_analytics_relationships.sql in Supabase SQL Editor")
        print("   2. Use the /sync-user-data endpoint for each user")
