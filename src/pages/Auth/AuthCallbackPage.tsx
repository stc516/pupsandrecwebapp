import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { supabase } from '../../lib/supabaseClient';

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // getSession will pick up tokens from URL when detectSessionInUrl is true
      await supabase.auth.getSession();
      navigate('/', { replace: true });
    };
    handleCallback();
  }, [navigate]);

  return <LoadingScreen />;
};

export default AuthCallbackPage;
