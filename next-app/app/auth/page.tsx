"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../../utils/supabaseClient";

export default function AuthPage() {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authEvent, setAuthEvent] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Auth session error:', error.message);
          setLoading(false);
          return;
        }
        
        if (session) {
          window.location.href = "/dashboard";
          return;
        }
      } catch (err) {
        console.log('Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      setAuthEvent(event);
      
      if (event === 'SIGNED_IN' && session) {
        // Force a reload of the page after successful sign-in
        window.location.href = "/dashboard";
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router]);

  // Render loading state
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card loading">
          <div className="loading-spinner"></div>
          <p>Loading authentication...</p>
        </div>
        <style jsx>{`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
      background-color: #f5f8ff;
    }
    
    .auth-card {
      width: 100%;
      max-width: 420px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 32px;
      overflow: hidden;
    }
    
    .auth-card.loading,
    .auth-card.processing {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 300px;
    }
    
    .auth-header {
      margin-bottom: 24px;
      text-align: center;
    }
    
    .auth-header h1 {
      margin: 0 0 8px;
      color: #4285f4;
      font-size: 1.8rem;
    }
    
    .auth-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }
    
    .auth-error {
      background-color: #fce8e6;
      color: #d93025;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .loading-spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 3px solid #4285f4;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    :global(.auth-form-container) {
      width: 100%;
    }
    
    :global(.auth-button) {
      width: 100%;
      padding: 10px;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    :global(.auth-button:hover) {
      background-color: #3367d6;
    }
    
    :global(.auth-input) {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    :global(.auth-input:focus) {
      border-color: #4285f4;
      outline: none;
    }
    
    :global(.auth-label) {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
      color: #555;
    }
    
    :global(.auth-message) {
      font-size: 14px;
      color: #666;
    }
  `}</style>
      </div>
    );
  }

  // Render processing state for various auth events
  if (authEvent === 'PASSWORD_RECOVERY' || authEvent === 'SIGNED_UP' || authEvent === 'SIGNED_IN') {
    return (
      <div className="auth-container">
        <div className="auth-card processing">
          <div className="loading-spinner"></div>
          <h2>
            {authEvent === 'PASSWORD_RECOVERY' ? 'Resetting Password...' :
             authEvent === 'SIGNED_UP' ? 'Account Created!' :
             'Signing you in...'}
          </h2>
          <p>Please wait while we redirect you...</p>
        </div>
        <style jsx>{`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
      background-color: #f5f8ff;
    }
    
    .auth-card {
      width: 100%;
      max-width: 420px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 32px;
      overflow: hidden;
    }
    
    .auth-card.loading,
    .auth-card.processing {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 300px;
    }
    
    .loading-spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 3px solid #4285f4;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    h2 {
      color: #4285f4;
      margin-top: 0;
    }
  `}</style>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Fortnite Analyzer</h1>
          <p>Sign in to access your dashboard</p>
        </div>
        
        {authError && (
          <div className="auth-error">
            {authError}
          </div>
        )}
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              container: {
                width: '100%',
              },
              button: {
                borderRadius: '4px',
                backgroundColor: '#4285f4',
                color: 'white',
                fontWeight: '500'
              },
              input: {
                borderRadius: '4px',
                padding: '10px 12px',
                fontSize: '16px'
              },
              label: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#555'
              },
              message: {
                fontSize: '14px',
                color: '#666'
              }
            }
          }}
          providers={[]}
          view="magic_link"
          redirectTo={`${window.location.origin}/auth`}
        />
      </div>
      <style jsx>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 24px;
          background-color: #f5f8ff;
        }
        
        .auth-card {
          width: 100%;
          max-width: 420px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 32px;
          overflow: hidden;
        }
        
        .auth-header {
          margin-bottom: 24px;
          text-align: center;
        }
        
        .auth-header h1 {
          margin: 0 0 8px;
          color: #4285f4;
          font-size: 1.8rem;
        }
        
        .auth-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }
        
        .auth-error {
          background-color: #fce8e6;
          color: #d93025;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

// This function is no longer needed since we've inlined the styles
// function getStyles() {
//   return `
//     ...styles...
//   `;
// }
