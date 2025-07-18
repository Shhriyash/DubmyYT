import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { supabase } from '../supabase/config';
import UserMenu from './UserMenu';
import videoBackground from '../assets/video_viral.jpg';

const words = ["Transform Your Videos", "Generate Subtitles", "Summarize Your Videos"];

const LandingPage = () => {
  const [displayText, setDisplayText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const typingSpeed = 100; // Speed in milliseconds per character
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleLogoClick = () => {
    window.location.reload();
  };

  const goToApp = (feature) => {
    const session = supabase.auth.getSession();
    if (!session) {
      navigate('/auth', { state: { from: '/app', feature } });
    } else {
      navigate('/app', { 
        state: { 
          defaultFeature: feature,
          mode: feature === 'subtitles' ? 'subtitles-only' : 'all'
        } 
      });
    }
  };

  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      const currentWord = words[currentWordIndex];

      if (!isDeleting && currentIndex <= currentWord.length) {
        setDisplayText(currentWord.substring(0, currentIndex).padEnd(currentWord.length, '\u00A0'));
        currentIndex++;
        timeoutId = setTimeout(type, typingSpeed);
      } else if (!isDeleting && currentIndex > currentWord.length) {
        isDeleting = true;
        timeoutId = setTimeout(type, 2000); // Pause at complete word
      } else if (isDeleting && currentIndex >= 0) {
        setDisplayText(currentWord.substring(0, currentIndex).padEnd(currentWord.length, '\u00A0'));
        currentIndex--;
        timeoutId = setTimeout(type, typingSpeed / 2);
      } else {
        isDeleting = false;
        currentIndex = 0;
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        timeoutId = setTimeout(type, typingSpeed);
      }
    };

    type();
    return () => clearTimeout(timeoutId);
  }, [currentWordIndex]);

  useEffect(() => {
    const handleScroll = () => {
      const nav = document.querySelector('.landing-nav');
      if (nav) {
        if (window.scrollY > 20) {
          nav.style.top = '0';
          nav.classList.add('scrolled');
        } else {
          nav.style.top = '-10px'; // Hide nav initially
          nav.classList.remove('scrolled');
        }
      }
    };

    // Set initial state
    const nav = document.querySelector('.landing-nav');
    if (nav) {
      nav.style.top = '-0px';
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div 
      className="landing-page" 
      style={{
        background: `url(${videoBackground}) center/cover no-repeat fixed`,
        backgroundSize: '110%'
      }}
    >
      <nav className="landing-nav">
        <div className="logo" onClick={handleLogoClick}>DubMyYT</div>
        <div className="nav-buttons">
          {user ? (
            <UserMenu userEmail={user.email} />
          ) : (
            <>
              <button className="login-btn" onClick={() => navigate('/auth')}>Login</button>
              <button className="signup-btn" onClick={() => navigate('/auth')}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      <div className="hero-section">
        <h1>{displayText}</h1>
        
        <div className="feature-cards">
          <div className="feature-card" onClick={() => goToApp('subtitles')}>
            <div className="card-icon">🎬</div>
            <h3>Subtitles</h3>
            <p>Generate accurate subtitles with timestamps</p>
            <button className="try-now-btn">Try Now</button>
          </div>

          <div className="feature-card" onClick={() => goToApp('summarize')}>
            <div className="card-icon">📝</div>
            <h3>Summarize</h3>
            <p>Get a concise summary of your content</p>
            <button className="try-now-btn">Try Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
