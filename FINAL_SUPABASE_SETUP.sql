-- =====================================================
-- COMPLETE DubMyYT DATABASE SETUP FOR SUPABASE
-- =====================================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Click "Run" once to create everything

-- =====================================================
-- 1. CREATE ALL TABLES
-- =====================================================

-- VIDEO_URL TABLE - Stores video information and metadata
CREATE TABLE video_url (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRANSCRIPTS TABLE - Stores transcription text data
CREATE TABLE transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES video_url(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUMMARIES TABLE - Stores video summary data
CREATE TABLE summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES video_url(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SUBTITLES TABLE - Stores subtitle/SRT file data
CREATE TABLE subtitles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES video_url(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    srt TEXT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_ANALYTICS TABLE - Stores user analytics and usage statistics
CREATE TABLE user_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    videos_processed INTEGER DEFAULT 0,
    summaries_generated INTEGER DEFAULT 0,
    subtitles_generated INTEGER DEFAULT 0,
    total_processing_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER_ACTIVITY_LOG TABLE - Stores detailed activity logs
CREATE TABLE user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES video_url(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DAILY_USAGE_STATS TABLE - Stores daily usage statistics
CREATE TABLE daily_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    videos_count INTEGER DEFAULT 0,
    summaries_count INTEGER DEFAULT 0,
    subtitles_count INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Video URL indexes
CREATE INDEX idx_video_url_user_id ON video_url(user_id);
CREATE INDEX idx_video_url_created_at ON video_url(created_at DESC);
CREATE UNIQUE INDEX idx_video_url_user_video ON video_url(user_id, video_url);

-- Transcripts indexes
CREATE INDEX idx_transcripts_video_id ON transcripts(video_id);
CREATE INDEX idx_transcripts_user_id ON transcripts(user_id);
CREATE UNIQUE INDEX idx_transcripts_video_lang ON transcripts(video_id, language);

-- Summaries indexes
CREATE INDEX idx_summaries_video_id ON summaries(video_id);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE UNIQUE INDEX idx_summaries_video_user ON summaries(video_id, user_id);

-- Subtitles indexes
CREATE INDEX idx_subtitles_video_id ON subtitles(video_id);
CREATE INDEX idx_subtitles_user_id ON subtitles(user_id);
CREATE UNIQUE INDEX idx_subtitles_video_lang ON subtitles(video_id, language);

-- User analytics indexes
CREATE UNIQUE INDEX idx_user_analytics_user_id ON user_analytics(user_id);

-- Activity log indexes
CREATE INDEX idx_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON user_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action ON user_activity_log(action);

-- Daily stats indexes
CREATE INDEX idx_daily_stats_user_id ON daily_usage_stats(user_id);
CREATE INDEX idx_daily_stats_date ON daily_usage_stats(date DESC);
CREATE UNIQUE INDEX idx_daily_stats_user_date ON daily_usage_stats(user_id, date);

-- =====================================================
-- 3. CREATE AUTOMATIC TIMESTAMP UPDATE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_video_url_updated_at 
    BEFORE UPDATE ON video_url 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at 
    BEFORE UPDATE ON transcripts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at 
    BEFORE UPDATE ON summaries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtitles_updated_at 
    BEFORE UPDATE ON subtitles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_analytics_updated_at 
    BEFORE UPDATE ON user_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_usage_stats_updated_at 
    BEFORE UPDATE ON daily_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE video_url ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtitles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- VIDEO_URL POLICIES
CREATE POLICY "Users can view own videos" ON video_url
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON video_url
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON video_url
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON video_url
    FOR DELETE USING (auth.uid() = user_id);

-- TRANSCRIPTS POLICIES
CREATE POLICY "Users can view own transcripts" ON transcripts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transcripts" ON transcripts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transcripts" ON transcripts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transcripts" ON transcripts
    FOR DELETE USING (auth.uid() = user_id);

-- SUMMARIES POLICIES
CREATE POLICY "Users can view own summaries" ON summaries
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own summaries" ON summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own summaries" ON summaries
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own summaries" ON summaries
    FOR DELETE USING (auth.uid() = user_id);

-- SUBTITLES POLICIES
CREATE POLICY "Users can view own subtitles" ON subtitles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subtitles" ON subtitles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subtitles" ON subtitles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subtitles" ON subtitles
    FOR DELETE USING (auth.uid() = user_id);

-- USER_ANALYTICS POLICIES
CREATE POLICY "Users can view own analytics" ON user_analytics
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON user_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- USER_ACTIVITY_LOG POLICIES
CREATE POLICY "Users can view own activity logs" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DAILY_USAGE_STATS POLICIES
CREATE POLICY "Users can view own daily stats" ON daily_usage_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily stats" ON daily_usage_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily stats" ON daily_usage_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 🎉 SETUP COMPLETE! 
-- Your DubMyYT database is ready to use!
-- =====================================================