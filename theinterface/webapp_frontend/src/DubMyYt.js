import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./index.css";
import { supabase } from "./supabase/config";

// ============================================================================
// CONSTANTS
// ============================================================================

const NAVIGATION_ITEMS = [
  { title: "Home", id: "home" },
  { title: "My Dashboard", id: "dashboard" }
];
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" }
];

// Dynamic API URL - works with localhost and tunneled URLs
const getApiBaseUrl = () => {
  // First priority: Environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Second priority: Detect if we're on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return "http://localhost:5000";
  }
  
  // Third priority: Use same host with port 5000 (for IP-based access)
  if (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    return `http://${window.location.hostname}:5000`;
  }
  
  // Fourth priority: For tunneled URLs, assume backend on same domain with port 5000
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging for API URL
console.log('API Base URL:', API_BASE_URL);
console.log('Current hostname:', window.location.hostname);
console.log('Current protocol:', window.location.protocol);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DubMyYT() {
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // UI State
  const [defaultFeature, setDefaultFeature] = useState(null);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
  // Input State
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("fr");
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // Video State
  const [videoBackground, setVideoBackground] = useState(null);
  const [isYoutubeVideo, setIsYoutubeVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // User State
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  
  // History State
  const [videoHistory, setVideoHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDetails, setVideoDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Results State
  const [processResults, setProcessResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const isValidUUID = (uuid) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  };

  const getUserInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 6000);
  };

  const formatVideoTitle = (videoUrl, title) => {
    if (title && title !== 'Untitled') {
      return title.length > 30 ? title.substring(0, 30) + '...' : title;
    }
    
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('youtu.be/')[1];
      return videoId ? `YouTube: ${videoId.substring(0, 8)}...` : 'YouTube Video';
    }
    
    return `Uploaded File: ${videoUrl.substring(0, 8)}...`;
  };

  // ============================================================================
  // YOUTUBE VIDEO HELPERS
  // ============================================================================

  const getYouTubeAudioUrl = (url) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1];
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&disablekb=1&modestbranding=1&playlist=${videoId}`;
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNavClick = (id) => {
    console.log(`Clicked ${id}`);
    if (id === 'home') {
      navigate('/');
    } else if (id === 'dashboard') {
      navigate('/dashboard');
    }
  };

  const handleDashboard = () => {
    console.log('Navigate to dashboard');
    navigate('/dashboard');
    setIsUserDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsUserDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBackToMain = () => {
    setSelectedVideo(null);
    setVideoDetails(null);
    setShowResults(false);
    setProcessResults(null);
    // Clear background video when returning to main view
    setVideoBackground(null);
    setIsYoutubeVideo(false);
  };

  // ============================================================================
  // INPUT HANDLERS
  // ============================================================================

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setSelectedFile(null);
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';

    if (url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
      setVideoBackground(url);
      setIsYoutubeVideo(true);
    } else {
      setVideoBackground(null);
      setIsYoutubeVideo(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setYoutubeUrl("");
    setIsYoutubeVideo(false);

    if (file && file.type.startsWith('video/')) {
      const videoUrl = URL.createObjectURL(file);
      setVideoBackground(videoUrl);
    }
  };

  // ============================================================================
  // UI TOGGLE HANDLERS
  // ============================================================================

  const toggleMute = () => {
    if (isYoutubeVideo) {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isMuted ? 'unMute' : 'mute'
          }),
          '*'
        );
      }
    } else {
      const video = document.querySelector('video');
      if (video) {
        video.muted = !video.muted;
      }
    }
    setIsMuted(!isMuted);
  };

  const toggleHistory = () => {
    setIsHistoryExpanded(!isHistoryExpanded);
    if (!isHistoryExpanded && videoHistory.length === 0) {
      fetchVideoHistory();
    }
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const clearUrl = () => {
    setYoutubeUrl('');
    setVideoBackground(null);
    setIsYoutubeVideo(false);
    setShowResults(false);
    setProcessResults(null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setVideoBackground(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    setShowResults(false);
    setProcessResults(null);
  };

  // ============================================================================
  // PROGRESS SIMULATION
  // ============================================================================

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress < 30) {
          return prevProgress + (Math.random() * 2);
        } else if (prevProgress < 60) {
          return prevProgress + (Math.random() * 1.5);
        } else if (prevProgress < 85) {
          return prevProgress + (Math.random() * 0.8);
        } else if (prevProgress < 95) {
          return prevProgress + (Math.random() * 0.3);
        }
        clearInterval(interval);
        return 95;
      });
    }, 200);
    return interval;
  };

  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================

  const fetchVideoHistory = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('video_url')
        .select('id, video_url, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setVideoHistory(data || []);
    } catch (error) {
      console.error('Error fetching video history:', error);
      setVideoHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId]);

  const deleteVideoFromHistory = async (videoId, videoTitle) => {
    // Ask for confirmation before deleting
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${videoTitle}" from your history? This action cannot be undone.`
    );
    
    if (!confirmDelete) {
      return;
    }

    try {
      // First, delete related records from user_activity_log
      const { error: activityLogError } = await supabase
        .from('user_activity_log')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', userId);

      if (activityLogError) {
        console.error('Error deleting activity log:', activityLogError);
        showError('Failed to delete video from history - activity log cleanup failed');
        return;
      }

      // Check and delete any other related records that might exist
      // This is a more robust approach to handle potential additional foreign keys
      try {
        // Delete from any other tables that might reference this video
        // (Add more tables here if you discover additional foreign key constraints)
        
        // Example: if there's a video_processing_log or similar table
        // await supabase.from('video_processing_log').delete().eq('video_id', videoId);
      } catch (relatedDeleteError) {
        console.warn('Error deleting related records:', relatedDeleteError);
        // Don't stop the process for related records that might not exist
      }

      // Then delete the video record
      const { error: videoError } = await supabase
        .from('video_url')
        .delete()
        .eq('id', videoId)
        .eq('user_id', userId);

      if (videoError) {
        console.error('Error deleting video:', videoError);
        showError('Failed to delete video from history');
        return;
      }

      // Remove the video from local state
      setVideoHistory(prevHistory => 
        prevHistory.filter(video => video.id !== videoId)
      );
      
      // If the deleted video was selected, clear the selection
      if (selectedVideo === videoId) {
        setSelectedVideo(null);
        setVideoDetails(null);
      }

      // Show success message
      console.log('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      showError('Failed to delete video from history');
    }
  };

  const fetchVideoDetails = async (videoId) => {
    setIsLoadingDetails(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/video-details/${videoId}`,
        {
          headers: {
            "X-User-Id": userId
          }
        }
      );
      setVideoDetails(response.data);
      setSelectedVideo(videoId);
    } catch (error) {
      console.error('Error fetching video details:', error);
      console.error('API URL used:', API_BASE_URL);
      
      if (!error.response) {
        showError(`Network error: Cannot connect to server at ${API_BASE_URL}`);
      } else if (error.response.status === 0) {
        showError('CORS error: Server is blocking the request');
      } else {
        showError(`Failed to load video details: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleHistoryItemClick = (video) => {
    // Set up background video playback like when entering URL in textbox
    if (video.video_url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
      setVideoBackground(video.video_url);
      setIsYoutubeVideo(true);
    } else {
      setVideoBackground(null);
      setIsYoutubeVideo(false);
    }
    
    // Fetch video details as before
    fetchVideoDetails(video.id);
  };

  // ============================================================================
  // DOWNLOAD FUNCTIONS
  // ============================================================================

  const downloadContent = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadSubtitle = (type, language) => {
    if (!processResults) return;
    
    const content = type === 'original' 
      ? processResults.original_subtitles 
      : processResults.translated_subtitles;
    const filename = type === 'original' 
      ? 'subtitles_original.srt' 
      : `subtitles_translated_${language}.srt`;
    
    downloadContent(content, filename, 'text/srt');
  };

  const downloadSummary = (type, language) => {
    if (!processResults) return;
    
    const content = type === 'original' 
      ? processResults.original_summary 
      : processResults.translated_summary;
    const filename = type === 'original' 
      ? 'summary_original.txt' 
      : `summary_translated_${language}.txt`;
    
    downloadContent(content, filename, 'text/plain');
  };

  const downloadExistingSubtitle = async (language) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/download-subtitle/${selectedVideo}/${language}`,
        {
          headers: {
            "X-User-Id": userId
          }
        }
      );
      
      const { content, filename } = response.data;
      const blob = new Blob([content], { type: 'text/srt' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showError('Failed to download subtitle');
      console.error(error);
    }
  };

  const downloadExistingSummary = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/download-summary/${selectedVideo}`,
        {
          headers: {
            "X-User-Id": userId
          }
        }
      );
      
      const { content, filename } = response.data;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      showError('Failed to download summary');
      console.error(error);
    }
  };

  // ============================================================================
  // MAIN API HANDLERS
  // ============================================================================

  const handleSubmit = async (action = 'both') => {
    if (isProcessing) return null;

    if (!isValidUUID(userId)) {
      showError("Invalid or missing user ID. Please log in again.");
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const progressInterval = simulateProgress();

    try {
      let response;
      if (youtubeUrl.trim() !== "") {
        response = await axios.post(
          `${API_BASE_URL}/upload`,
          { youtube_url: youtubeUrl, language, action },
          {
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": userId
            }
          }
        );
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("language", language);
        formData.append("action", action);

        response = await axios.post(
          `${API_BASE_URL}/upload`,
          formData,
          {
            headers: {
              "X-User-Id": userId
            }
          }
        );
      } else {
        showError("Please enter a YouTube URL or upload a file.");
        setIsProcessing(false);
        clearInterval(progressInterval);
        setProgress(0);
        return null;
      }

      setProgress(97);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsProcessing(false);
      setProgress(0);
      setError(null);
      
      // Show results inline instead of opening new window
      if (response?.data) {
        setProcessResults(response.data);
        setShowResults(true);
      }
      
      return response;
      
    } catch (error) {
      console.error('API Request Error:', error);
      
      if (error.response && error.response.data && error.response.data.error) {
        const errorMessage = error.response.data.error;
        // Special handling for YouTube download errors
        if (errorMessage.includes('HTTP Error 403') || errorMessage.includes('Forbidden')) {
          showError('YouTube download blocked. This video may be restricted or have anti-bot protection. Try a different video or try again later.');
        } else if (errorMessage.includes('Requested format is not available')) {
          showError('Video format not available. YouTube may have changed their format restrictions. Try a different video.');
        } else if (errorMessage.includes('Video unavailable')) {
          showError('Video is unavailable or private. Please check the URL and try again.');
        } else {
          showError(errorMessage);
        }
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        showError(`Network error: Unable to connect to server at ${API_BASE_URL}. Check if server is running and accessible.`);
      } else if (error.response?.status === 0) {
        showError('CORS error: Server rejecting requests. Check server CORS configuration.');
      } else {
        showError(`Error processing request: ${error.message || 'Unknown error'}`);
      }
      setIsProcessing(false);
      clearInterval(progressInterval);
      setProgress(0);
      return null;
    }
  };

  const handleGenerateSubtitles = async () => {
    // Check if user has provided input before starting
    if (!youtubeUrl.trim() && !selectedFile) {
      showError("Please enter a YouTube URL or upload a file to generate subtitles.");
      return;
    }

    try {
      await handleSubmit('subtitles');
    } catch (error) {
      showError("Error generating subtitles");
      console.error(error);
    }
  };

  const handleSummarize = async () => {
    // Check if user has provided input before starting
    if (!youtubeUrl.trim() && !selectedFile) {
      showError("Please enter a YouTube URL or upload a file to generate summary.");
      return;
    }

    try {
      await handleSubmit('summarize');
    } catch (error) {
      showError("Error in summarization");
      console.error(error);
    }
  };

  // ============================================================================
  // EFFECTS AND LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (location.state?.defaultFeature) {
      setDefaultFeature(location.state.defaultFeature);
    }
  }, [location]);

  useEffect(() => {
    return () => {
      if (videoBackground && !isYoutubeVideo) {
        URL.revokeObjectURL(videoBackground);
      }
    };
  }, [videoBackground, isYoutubeVideo]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      setUserEmail(user?.email || null);
      if (user?.id && isHistoryExpanded) {
        fetchVideoHistory();
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      const newUserEmail = session?.user?.email || null;
      setUserId(newUserId);
      setUserEmail(newUserEmail);
      if (newUserId && isHistoryExpanded) {
        fetchVideoHistory();
      }
    });
    return () => subscription.unsubscribe();
  }, [isHistoryExpanded, fetchVideoHistory]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="main-body relative min-h-screen">
      {/* Video Background */}
      {videoBackground && (
        <>
          <div className="fixed inset-0 z-0">
            {isYoutubeVideo ? (
              <iframe
                className="w-full h-full object-cover"
                src={getYouTubeAudioUrl(videoBackground)}
                allow="autoplay"
                frameBorder="0"
                title="YouTube audio player"
              />
            ) : (
              <audio
                autoPlay
                loop
                muted={isMuted}
                src={videoBackground}
              />
            )}
          </div>
          <button 
            className="volume-control"
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </>
      )}

      {/* Semi-transparent overlay */}
      <div className="fixed inset-0 bg-black/50 z-10" />

      {/* Main content */}
      <div className="relative z-20">
        <div className="header-container">
          <div className="header-left">
            {/* Hamburger Menu Button - only visible when drawer is collapsed */}
            {isDrawerCollapsed && (
              <button 
                className="hamburger-menu"
                onClick={() => setIsDrawerCollapsed(false)}
                title="Open navigation menu"
              >
                ☰
              </button>
            )}
            
            <h1 
              className={`header-text ${isDrawerCollapsed ? 'drawer-collapsed' : ''}`} 
              onClick={handleLogoClick}
            >
              DubMyYT
            </h1>
          </div>
          
          {/* User Avatar and Dropdown */}
          {userEmail && (
            <div className="user-menu">
              <div 
                className="user-avatar"
                onClick={toggleUserDropdown}
              >
                {getUserInitials(userEmail)}
              </div>
              
              {isUserDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <span className="user-email">{userEmail}</span>
                  </div>
                  <button 
                    className="dropdown-item"
                    onClick={handleDashboard}
                  >
                    My Dashboard
                  </button>
                  <button 
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="error-dialog">
            Warning: {error}
          </div>
        )}
        
        {/* Backdrop overlay for closing drawer */}
        <div 
          className={`drawer-backdrop ${!isDrawerCollapsed ? 'active' : ''}`}
          onClick={() => setIsDrawerCollapsed(true)}
        />
        
        <div 
          className={`nav-drawer ${isDrawerCollapsed ? 'collapsed' : ''}`}
          onClick={() => setIsDrawerCollapsed(true)}
        >
          <div className="drawer-divider" />
          <div className="nav-content" onClick={e => e.stopPropagation()}>
            {NAVIGATION_ITEMS.map((item) => (
              <div 
                key={item.id}
                className="nav-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavClick(item.id);
                }}
              >
                {item.title}
              </div>
            ))}
            
            {/* History Section */}
            <div className="history-section">
              <div 
                className="nav-item history-header"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHistory();
                }}
              >
                <span>History</span>
                <span className={`history-arrow ${isHistoryExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              
              {isHistoryExpanded && (
                <div className="history-content">
                  {isLoadingHistory ? (
                    <div className="history-item loading">Loading...</div>
                  ) : videoHistory.length === 0 ? (
                    <div className="history-item empty">Nothing to show</div>
                  ) : (
                    videoHistory.map((video, index) => (
                      <div 
                        key={video.id}
                        className="history-item"
                        title={`Processed on ${new Date(video.created_at).toLocaleDateString()}`}
                      >
                        <span 
                          className="history-title"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHistoryItemClick(video);
                          }}
                        >
                          {formatVideoTitle(video.video_url, video.title)}
                        </span>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVideoFromHistory(video.id, formatVideoTitle(video.video_url, video.title));
                          }}
                          title="Remove from history"
                          aria-label="Delete video from history"
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Help & Support at the bottom */}
          <div 
            className="nav-item help-support"
            onClick={(e) => {
              e.stopPropagation();
              handleNavClick("help");
            }}
          >
            Help & Support
          </div>
        </div>

        <div className={`main-content ${isDrawerCollapsed ? 'drawer-collapsed' : ''}`}>
          {selectedVideo && videoDetails ? (
            // Video Details View
            <div className="app-container backdrop-blur-sm bg-black/30">
              <div className="container">
                <div className="video-details-header">
                  <button 
                    className="back-button"
                    onClick={handleBackToMain}
                  >
                    ← Back
                  </button>
                  <h3 className="video-title">{videoDetails.video_info.title}</h3>
                </div>
                
                {isLoadingDetails ? (
                  <div className="loading-details">Loading...</div>
                ) : (
                  <div className="video-summary">
                    {/* Video URL (clickable if YouTube) */}
                    {videoDetails.video_info.video_url.includes('youtube.com') || videoDetails.video_info.video_url.includes('youtu.be') ? (
                      <p>
                        <strong>Video:</strong>{' '}
                        <a 
                          href={videoDetails.video_info.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="video-link"
                        >
                          Watch on YouTube
                        </a>
                      </p>
                    ) : (
                      <p><strong>Video:</strong> Uploaded File</p>
                    )}
                    
                    {/* Processing Date */}
                    <p><strong>Processed:</strong> {new Date(videoDetails.video_info.created_at).toLocaleDateString()}</p>
                    
                    {/* Available Downloads */}
                    <div className="downloads">
                      {videoDetails.has_summary && (
                        <button 
                          className="download-btn-compact"
                          onClick={downloadExistingSummary}
                        >
                          Download Summary
                        </button>
                      )}
                      
                      {videoDetails.available_subtitles.map(lang => (
                        <button 
                          key={lang}
                          className="download-btn-compact"
                          onClick={() => downloadExistingSubtitle(lang)}
                        >
                          Download {lang.toUpperCase()} Subtitles
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Main Application View
            <div className="app-container backdrop-blur-sm bg-black/30">
              <div className="container">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter YouTube URL..."
                    value={youtubeUrl}
                    onChange={handleUrlChange}
                    className="input-box"
                    disabled={selectedFile !== null}
                  />
                  <button 
                    className={`clear-button ${youtubeUrl ? 'visible' : ''}`}
                    onClick={clearUrl}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
                <p className="or-text">OR</p>
                <div className="input-wrapper">
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.ogg"
                    onChange={handleFileChange}
                    className="file-input"
                    disabled={youtubeUrl !== ""}
                  />
                  <button 
                    className={`clear-button ${selectedFile ? 'visible' : ''}`}
                    onClick={clearFile}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
                <p className="language-label">Select Output Language : </p>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="dropdown"
                >
                  {LANGUAGE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="action-buttons">
                  {(!defaultFeature || defaultFeature === 'subtitles') && (
                    <button 
                      onClick={handleGenerateSubtitles} 
                      className="action-button transcribe-button"
                      disabled={isProcessing || (!youtubeUrl && !selectedFile)}
                    >
                      Generate Subtitles
                    </button>
                  )}
                  {(!defaultFeature || defaultFeature === 'summarize') && (
                    <button 
                      onClick={handleSummarize} 
                      className="action-button summarize-button"
                      disabled={isProcessing || (!youtubeUrl && !selectedFile)}
                    >
                      Summarize
                    </button>
                  )}
                </div>
                {isProcessing && (
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    >
                      {Math.round(progress)}%
                    </div>
                  </div>
                )}
                
                {/* Results Display */}
                {showResults && processResults && (
                  <div className="results-container">
                    <div className="results-header">
                      <h3>Processing Results</h3>
                      <button 
                        className="close-results"
                        onClick={() => setShowResults(false)}
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Subtitles Results */}
                    {processResults.original_subtitles && (
                      <div className="result-section">
                        <h4>Subtitles Generated</h4>
                        
                        <div className="subtitle-preview">
                          <div className="preview-section">
                            <h5>Original Subtitles (Preview)</h5>
                            <pre className="subtitle-preview-text">
                              {processResults.original_subtitles.split('\n').slice(0, 10).join('\n')}
                              {processResults.original_subtitles.split('\n').length > 10 ? '\n...' : ''}
                            </pre>
                            <button 
                              className="download-btn"
                              onClick={() => downloadSubtitle('original', language)}
                            >
                              Download Original SRT
                            </button>
                          </div>
                          
                          {processResults.translated_subtitles && (
                            <div className="preview-section">
                              <h5>Translated Subtitles ({processResults.target_language?.toUpperCase()}) (Preview)</h5>
                              <pre className="subtitle-preview-text">
                                {processResults.translated_subtitles.split('\n').slice(0, 10).join('\n')}
                                {processResults.translated_subtitles.split('\n').length > 10 ? '\n...' : ''}
                              </pre>
                              <button 
                                className="download-btn"
                                onClick={() => downloadSubtitle('translated', processResults.target_language)}
                              >
                                Download {processResults.target_language?.toUpperCase()} SRT
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Summary Results */}
                    {processResults.original_summary && (
                      <div className="result-section">
                        <h4>Summary Generated</h4>
                        
                        <div className="summary-preview">
                          <div className="preview-section">
                            <h5>Original Summary</h5>
                            <div className="summary-preview-text">
                              {processResults.original_summary.length > 300 
                                ? processResults.original_summary.substring(0, 300) + '...'
                                : processResults.original_summary
                              }
                            </div>
                            <button 
                              className="download-btn"
                              onClick={() => downloadSummary('original', language)}
                            >
                              Download Original Summary
                            </button>
                          </div>
                          
                          {processResults.translated_summary && (
                            <div className="preview-section">
                              <h5>Translated Summary ({processResults.target_language?.toUpperCase()})</h5>
                              <div className="summary-preview-text">
                                {processResults.translated_summary.length > 300 
                                  ? processResults.translated_summary.substring(0, 300) + '...'
                                  : processResults.translated_summary
                                }
                              </div>
                              <button 
                                className="download-btn"
                                onClick={() => downloadSummary('translated', processResults.target_language)}
                              >
                                Download {processResults.target_language?.toUpperCase()} Summary
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DubMyYT;
