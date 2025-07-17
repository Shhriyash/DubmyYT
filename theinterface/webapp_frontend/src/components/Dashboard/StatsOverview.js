import React from 'react';

const StatsOverview = ({ analytics }) => {
  const stats = [
    {
      title: 'Videos Processed',
      value: analytics.videos_processed || 0,
      icon: '🎬',
      color: '#667eea',
      description: 'Total videos processed'
    },
    {
      title: 'Summaries Generated',
      value: analytics.summaries_generated || 0,
      icon: '📝',
      color: '#764ba2',
      description: 'AI summaries created'
    },
    {
      title: 'Subtitles Created',
      value: analytics.subtitles_generated || 0,
      icon: '📄',
      color: '#f093fb',
      description: 'Subtitle files generated'
    },
    {
      title: 'Languages Used',
      value: analytics.languages_used?.length || 0,
      icon: '🌍',
      color: '#4facfe',
      description: 'Different languages processed'
    },
    {
      title: 'Processing Time',
      value: `${Math.round((analytics.total_processing_time || 0) / 60)}m`,
      icon: '⏱️',
      color: '#43e97b',
      description: 'Total time spent processing'
    }
  ];

  const formatLastActivity = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="stats-overview">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="stat-card"
            style={{ '--accent-color': stat.color }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-title">{stat.title}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          </div>
        ))}
      </div>
      
      {analytics.last_activity && (
        <div className="last-activity">
          <span className="activity-label">Last Activity:</span>
          <span className="activity-date">{formatLastActivity(analytics.last_activity)}</span>
        </div>
      )}
      
      {analytics.languages_used && analytics.languages_used.length > 0 && (
        <div className="languages-used">
          <span className="languages-label">Languages:</span>
          <div className="language-tags">
            {analytics.languages_used.map((lang, index) => (
              <span key={index} className="language-tag">
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsOverview;
