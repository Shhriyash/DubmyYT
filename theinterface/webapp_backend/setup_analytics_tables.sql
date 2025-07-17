-- =============================================================================
-- DubMyYT Analytics Tables Setup
-- Run these SQL commands in your Supabase SQL Editor to create analytics tables
-- =============================================================================

-- 1. User Analytics Table
-- Stores overall user statistics and metadata
CREATE TABLE IF NOT EXISTS user_analytics (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    videos_processed INTEGER DEFAULT 0,
    summaries_generated INTEGER DEFAULT 0,
    subtitles_generated INTEGER DEFAULT 0,
    languages_used JSONB DEFAULT '[]'::jsonb,
    total_processing_time INTEGER DEFAULT 0, -- in seconds
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. User Activity Log Table
-- Detailed log of all user activities for timeline and analysis
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'video_processed', 'summary_generated', 'subtitle_generated'
    video_id INTEGER REFERENCES video_url(id) ON DELETE CASCADE,
    language VARCHAR(10),
    processing_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily Usage Statistics Table
-- Aggregated daily statistics for trend analysis and dashboard charts
CREATE TABLE IF NOT EXISTS daily_usage_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    videos_count INTEGER DEFAULT 0,
    summaries_count INTEGER DEFAULT 0,
    subtitles_count INTEGER DEFAULT 0,
    unique_languages INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Index for user analytics lookups
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);

-- Indexes for activity log queries
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON user_activity_log(activity_type);

-- Indexes for daily usage stats
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_user_id ON daily_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_date ON daily_usage_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_user_date ON daily_usage_stats(user_id, date);

-- =============================================================================
-- Triggers for Automatic Updates
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_analytics table
DROP TRIGGER IF EXISTS update_user_analytics_updated_at ON user_analytics;
CREATE TRIGGER update_user_analytics_updated_at
    BEFORE UPDATE ON user_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS) Policies
-- Enable RLS if needed (optional since you mentioned RLS is disabled)
-- =============================================================================

-- Enable RLS on analytics tables (uncomment if you want to enable RLS)
-- ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_usage_stats ENABLE ROW LEVEL SECURITY;

-- Create policies (uncomment if enabling RLS)
-- CREATE POLICY "Users can view their own analytics" ON user_analytics
--     FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can view their own activity log" ON user_activity_log
--     FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can view their own daily stats" ON daily_usage_stats
--     FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- Sample Data Insertion (Optional - for testing)
-- =============================================================================

-- Insert sample analytics data (replace with actual user UUID for testing)
-- INSERT INTO user_analytics (user_id, videos_processed, summaries_generated, subtitles_generated, languages_used)
-- VALUES ('00000000-0000-0000-0000-000000000000', 5, 4, 8, '["en", "fr", "es"]'::jsonb);

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Check if tables were created successfully
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_analytics', 'user_activity_log', 'daily_usage_stats');

-- Check table structures
\d user_analytics;
\d user_activity_log;
\d daily_usage_stats;
