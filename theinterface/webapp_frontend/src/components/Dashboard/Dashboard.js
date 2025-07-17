import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/config';
import SubtitlesChart from './SubtitlesChart';
import SummariesChart from './SummariesChart';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate('/auth');
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleBackToDubMyYT = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-nav">
        <button className="back-button" onClick={handleBackToDubMyYT}>
          ← Back to DubMyYT
        </button>
      </div>

      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      <div className="dashboard-content">
        <div className="charts-grid">
          <SubtitlesChart />
          <SummariesChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
