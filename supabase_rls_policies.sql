-- =====================================================
-- DubMyYT Row Level Security (RLS) Policies
-- =====================================================
-- Run these commands AFTER creating the schema
-- These ensure users can only access their own data

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE video_url ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VIDEO_URL TABLE POLICIES
-- =====================================================
-- Users can view their own videos
CREATE POLICY "Users can view own videos" ON video_url
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own videos
CREATE POLICY "Users can insert own videos" ON video_url
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own videos
CREATE POLICY "Users can update own videos" ON video_url
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos" ON video_url
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRANSCRIPTS TABLE POLICIES
-- =====================================================
-- Users can view their own transcripts
CREATE POLICY "Users can view own transcripts" ON transcripts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own transcripts
CREATE POLICY "Users can insert own transcripts" ON transcripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own transcripts
CREATE POLICY "Users can update own transcripts" ON transcripts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own transcripts
CREATE POLICY "Users can delete own transcripts" ON transcripts
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SUMMARIES TABLE POLICIES
-- =====================================================
-- Users can view their own summaries
CREATE POLICY "Users can view own summaries" ON summaries
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own summaries
CREATE POLICY "Users can insert own summaries" ON summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own summaries
CREATE POLICY "Users can update own summaries" ON summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own summaries
CREATE POLICY "Users can delete own summaries" ON summaries
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SUBTITLES TABLE POLICIES
-- =====================================================
-- Users can view their own subtitles
CREATE POLICY "Users can view own subtitles" ON subtitles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subtitles
CREATE POLICY "Users can insert own subtitles" ON subtitles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own subtitles
CREATE POLICY "Users can update own subtitles" ON subtitles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own subtitles
CREATE POLICY "Users can delete own subtitles" ON subtitles
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- USER_ANALYTICS TABLE POLICIES
-- =====================================================
-- Users can view their own analytics
CREATE POLICY "Users can view own analytics" ON user_analytics
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own analytics
CREATE POLICY "Users can insert own analytics" ON user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own analytics
CREATE POLICY "Users can update own analytics" ON user_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- USER_ACTIVITY_LOG TABLE POLICIES
-- =====================================================
-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DAILY_USAGE_STATS TABLE POLICIES
-- =====================================================
-- Users can view their own daily stats
CREATE POLICY "Users can view own daily stats" ON daily_usage_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own daily stats
CREATE POLICY "Users can insert own daily stats" ON daily_usage_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own daily stats
CREATE POLICY "Users can update own daily stats" ON daily_usage_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- ADDITIONAL SECURITY SETTINGS
-- =====================================================

-- Enable realtime for relevant tables (if needed)
-- Uncomment these if you want real-time subscriptions
-- ALTER PUBLICATION supabase_realtime ADD TABLE video_url;
-- ALTER PUBLICATION supabase_realtime ADD TABLE user_activity_log;

-- =====================================================
-- RLS POLICIES SETUP COMPLETE!
-- Your database is now secure and ready to use
-- =====================================================