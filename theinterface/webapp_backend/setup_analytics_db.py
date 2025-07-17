#!/usr/bin/env python3
"""
Database Setup Script for DubMyYT Analytics
Run this script to automatically create the required analytics tables in Supabase.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_analytics_tables():
    """
    Create analytics tables using Supabase RPC calls.
    This method uses SQL execution through Supabase.
    """
    
    print("🚀 Setting up DubMyYT Analytics Tables...")
    
    # SQL for creating analytics tables
    sql_commands = [
        # User Analytics Table
        """
        CREATE TABLE IF NOT EXISTS user_analytics (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            videos_processed INTEGER DEFAULT 0,
            summaries_generated INTEGER DEFAULT 0,
            subtitles_generated INTEGER DEFAULT 0,
            languages_used JSONB DEFAULT '[]'::jsonb,
            total_processing_time INTEGER DEFAULT 0,
            last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        """,
        
        # User Activity Log Table
        """
        CREATE TABLE IF NOT EXISTS user_activity_log (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            activity_type VARCHAR(50) NOT NULL,
            video_id INTEGER,
            language VARCHAR(10),
            processing_time INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        
        # Daily Usage Statistics Table
        """
        CREATE TABLE IF NOT EXISTS daily_usage_stats (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            date DATE NOT NULL,
            videos_count INTEGER DEFAULT 0,
            summaries_count INTEGER DEFAULT 0,
            subtitles_count INTEGER DEFAULT 0,
            unique_languages INTEGER DEFAULT 0,
            total_time INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, date)
        );
        """,
        
        # Indexes for Performance
        """
        CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_user_id ON daily_usage_stats(user_id);
        CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_date ON daily_usage_stats(date DESC);
        """,
        
        # Update function and trigger
        """
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """,
        
        """
        DROP TRIGGER IF EXISTS update_user_analytics_updated_at ON user_analytics;
        CREATE TRIGGER update_user_analytics_updated_at
            BEFORE UPDATE ON user_analytics
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        """
    ]
    
    # Execute each SQL command
    for i, sql in enumerate(sql_commands, 1):
        try:
            print(f"📄 Executing SQL command {i}/{len(sql_commands)}...")
            result = supabase.rpc('exec_sql', {'sql': sql.strip()}).execute()
            print(f"✅ Command {i} executed successfully")
        except Exception as e:
            print(f"❌ Error executing command {i}: {e}")
            # Continue with other commands even if one fails
            continue
    
    print("\n🎉 Analytics tables setup completed!")
    print("\n📋 Tables created:")
    print("   • user_analytics - Stores overall user statistics")
    print("   • user_activity_log - Detailed activity logging")
    print("   • daily_usage_stats - Daily aggregated statistics")
    print("\n🔗 You can now use the analytics endpoints in your application!")

def verify_tables():
    """
    Verify that the tables were created successfully.
    """
    print("\n🔍 Verifying table creation...")
    
    tables_to_check = ['user_analytics', 'user_activity_log', 'daily_usage_stats']
    
    for table in tables_to_check:
        try:
            # Try to query the table (this will fail if table doesn't exist)
            result = supabase.table(table).select("*").limit(1).execute()
            print(f"✅ Table '{table}' exists and is accessible")
        except Exception as e:
            print(f"❌ Table '{table}' verification failed: {e}")

def manual_table_creation():
    """
    Alternative method: Create tables individually using the Supabase Python client.
    Use this if the RPC method doesn't work.
    """
    print("\n⚠️  If automatic setup failed, please run the SQL commands manually:")
    print("\n1. Go to your Supabase Dashboard")
    print("2. Navigate to the SQL Editor")
    print("3. Copy and paste the contents of 'setup_analytics_tables.sql'")
    print("4. Execute the SQL commands")
    print("\nOr use the Supabase CLI:")
    print("supabase db reset")
    print("supabase db push")

if __name__ == "__main__":
    print("🎯 DubMyYT Analytics Database Setup")
    print("=" * 50)
    
    # Check if environment variables are set
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables are required!")
        print("Please check your .env file.")
        exit(1)
    
    try:
        create_analytics_tables()
        verify_tables()
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        print("\n📝 Please try manual setup instead:")
        manual_table_creation()
