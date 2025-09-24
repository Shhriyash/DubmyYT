import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase/config';
import './AuthPage.css';
import authVideo from '../../assets/Untitled design.mp4';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const feature = location.state?.feature;
  const initialMode = location.state?.mode || 'login'; // Get mode from navigation state
  
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSignUpSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        // If coming from a feature click, navigate to app with that feature
        if (feature) {
          navigate('/app', { state: { defaultFeature: feature } });
        } else {
          navigate(from);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    setIsSignUp(false);
    setSignUpSuccess(false);
  };

  return (
    <div className="auth-container">
      {/* Video Background */}
      <video 
        className="auth-video-background"
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src={authVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Semi-transparent overlay */}
      <div className="auth-overlay" />
      
      <div className="auth-box">
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        {error && <div className="auth-error">{error}</div>}
        {signUpSuccess ? (
          <div className="success-message">
            <p>Please check your email to confirm your signup!</p>
            <button 
              onClick={handleReturnToLogin}
              className="return-login-btn"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="toggle-auth">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <span onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? ' Sign In' : ' Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
