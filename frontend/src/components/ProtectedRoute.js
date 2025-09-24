import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase/config';

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Temporary bypass for Supabase outage in ap-south-1 region
  const TEMP_BYPASS_AUTH = process.env.REACT_APP_ENV === 'production' || process.env.NODE_ENV === 'production';

  useEffect(() => {
    // If in temporary bypass mode, skip authentication
    if (TEMP_BYPASS_AUTH) {
      console.warn('⚠️ TEMPORARY: Authentication bypassed due to Supabase ap-south-1 region outage');
      setSession({ user: { id: 'temp-user-id', email: 'temp@dubmyyt.com' } });
      setLoading(false);
      return;
    }

    // Normal authentication flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(error => {
      console.error('Supabase auth error:', error);
      // Fallback to bypass if Supabase is down
      if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
        console.warn('⚠️ TEMPORARY: Authentication bypassed due to Supabase connectivity issues');
        setSession({ user: { id: 'temp-user-id', email: 'temp@dubmyyt.com' } });
      }
      setLoading(false);
    });

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [TEMP_BYPASS_AUTH]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    // Save the location they tried to visit
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
