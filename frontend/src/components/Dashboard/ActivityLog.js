import React from 'react';

const ActivityLog = ({ activities }) => {
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'video_processed':
        return '🎬';
      case 'summary_generated':
        return '📝';
      case 'subtitle_generated':
        return '📄';
      default:
        return '⚡';
    }
  };

  const getActivityText = (activity) => {
    switch (activity.activity_type) {
      case 'video_processed':
        return 'Processed a new video';
      case 'summary_generated':
        return `Generated summary${activity.language ? ` in ${activity.language.toUpperCase()}` : ''}`;
      case 'subtitle_generated':
        return `Created subtitles${activity.language ? ` in ${activity.language.toUpperCase()}` : ''}`;
      default:
        return 'Performed an action';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="activity-log">
        <div className="no-activity">
          <div className="no-activity-icon">📊</div>
          <p>No recent activity</p>
          <span>Start processing videos to see your activity here!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-log">
      <div className="activity-list">
        {activities.map((activity, index) => (
          <div key={activity.id || index} className="activity-item">
            <div className="activity-icon">
              {getActivityIcon(activity.activity_type)}
            </div>
            <div className="activity-details">
              <div className="activity-text">
                {getActivityText(activity)}
              </div>
              <div className="activity-meta">
                <span className="activity-time">
                  {formatTime(activity.created_at)}
                </span>
                {activity.processing_time > 0 && (
                  <span className="processing-time">
                    • {activity.processing_time}s
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
