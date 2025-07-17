import React from 'react';

const AchievementCard = ({ achievement }) => {
  return (
    <div className="achievement-card">
      <div className="achievement-icon-wrapper">
        <div className="achievement-icon">{achievement.icon}</div>
        <div className="achievement-glow"></div>
      </div>
      <div className="achievement-content">
        <h3 className="achievement-name">{achievement.name}</h3>
        <p className="achievement-description">{achievement.description}</p>
      </div>
      <div className="achievement-badge">
        <span className="badge-text">Unlocked!</span>
      </div>
    </div>
  );
};

export default AchievementCard;
