-- =============================================================================
-- Fix Analytics Table Relationships
-- Run this to add missing foreign key constraints and relationships
-- =============================================================================

-- First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('video_url', 'user_analytics', 'user_activity_log', 'daily_usage_stats');

-- =============================================================================
-- Add Foreign Key Constraints
-- =============================================================================

-- Add foreign key constraint to user_activity_log table
-- This connects activity log entries to the video_url table
ALTER TABLE user_activity_log 
ADD CONSTRAINT fk_user_activity_log_video_id 
FOREIGN KEY (video_id) REFERENCES video_url(id) ON DELETE CASCADE;

-- =============================================================================
-- Add Missing Indexes for Foreign Keys
-- =============================================================================

-- Index on video_id for better join performance
CREATE INDEX IF NOT EXISTS idx_user_activity_log_video_id ON user_activity_log(video_id);

-- Composite index for user + video queries
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_video ON user_activity_log(user_id, video_id);

-- =============================================================================
-- Verify Existing Table Structure
-- =============================================================================

-- Check video_url table structure to ensure compatibility
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'video_url' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have the right user_id type in video_url
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'video_url' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- =============================================================================
-- Add User Reference Indexes for Performance
-- =============================================================================

-- Ensure we have indexes on user_id columns across all tables for join performance
CREATE INDEX IF NOT EXISTS idx_video_url_user_id ON video_url(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_user_id ON subtitles(user_id);

-- =============================================================================
-- Create Views for Easy Analytics Queries
-- =============================================================================

-- View: User Activity with Video Details
CREATE OR REPLACE VIEW user_activity_with_video AS
SELECT 
    ual.id,
    ual.user_id,
    ual.activity_type,
    ual.language,
    ual.processing_time,
    ual.created_at,
    vu.video_url,
    vu.title as video_title,
    vu.created_at as video_created_at
FROM user_activity_log ual
LEFT JOIN video_url vu ON ual.video_id = vu.id
ORDER BY ual.created_at DESC;

-- View: User Summary Stats
CREATE OR REPLACE VIEW user_summary_stats AS
SELECT 
    ua.user_id,
    ua.videos_processed,
    ua.summaries_generated,
    ua.subtitles_generated,
    ua.languages_used,
    ua.total_processing_time,
    ua.last_activity,
    COUNT(DISTINCT vu.id) as actual_video_count,
    COUNT(DISTINCT s.id) as actual_summary_count,
    COUNT(DISTINCT sub.id) as actual_subtitle_count
FROM user_analytics ua
LEFT JOIN video_url vu ON ua.user_id = vu.user_id
LEFT JOIN summaries s ON ua.user_id = s.user_id
LEFT JOIN subtitles sub ON ua.user_id = sub.user_id
GROUP BY ua.user_id, ua.videos_processed, ua.summaries_generated, 
         ua.subtitles_generated, ua.languages_used, ua.total_processing_time, ua.last_activity;

-- =============================================================================
-- Data Consistency Functions
-- =============================================================================

-- Function to sync analytics with actual data
CREATE OR REPLACE FUNCTION sync_user_analytics(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    video_count INTEGER;
    summary_count INTEGER;
    subtitle_count INTEGER;
    all_languages JSONB;
BEGIN
    -- Count actual videos for user
    SELECT COUNT(*) INTO video_count
    FROM video_url 
    WHERE user_id = target_user_id;
    
    -- Count actual summaries for user
    SELECT COUNT(*) INTO summary_count
    FROM summaries 
    WHERE user_id = target_user_id;
    
    -- Count actual subtitles for user
    SELECT COUNT(DISTINCT video_id || language) INTO subtitle_count
    FROM subtitles 
    WHERE user_id = target_user_id;
    
    -- Get all languages used
    SELECT COALESCE(json_agg(DISTINCT language), '[]'::json)::jsonb INTO all_languages
    FROM subtitles 
    WHERE user_id = target_user_id AND language IS NOT NULL;
    
    -- Update or insert analytics
    INSERT INTO user_analytics (
        user_id, 
        videos_processed, 
        summaries_generated, 
        subtitles_generated, 
        languages_used
    ) VALUES (
        target_user_id, 
        video_count, 
        summary_count, 
        subtitle_count, 
        all_languages
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        videos_processed = video_count,
        summaries_generated = summary_count,
        subtitles_generated = subtitle_count,
        languages_used = all_languages,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to sync analytics for all users
CREATE OR REPLACE FUNCTION sync_all_user_analytics()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    sync_count INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id FROM video_url
    LOOP
        PERFORM sync_user_analytics(user_record.user_id);
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Verification and Testing
-- =============================================================================

-- Test the foreign key constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_activity_log_video_id'
    ) THEN
        RAISE NOTICE 'Foreign key constraint successfully added!';
    ELSE
        RAISE NOTICE 'Foreign key constraint not found - check for errors above';
    END IF;
END $$;

-- Show final table relationships
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('user_activity_log')
    AND tc.table_schema = 'public';

-- =============================================================================
-- Sample Usage
-- =============================================================================

-- Sync analytics for all existing users (uncomment to run)
-- SELECT sync_all_user_analytics();

-- Check the new views
-- SELECT * FROM user_activity_with_video LIMIT 5;
-- SELECT * FROM user_summary_stats LIMIT 5;
