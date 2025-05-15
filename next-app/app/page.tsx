"use client";
import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

export default function Home() {
  useEffect(() => {
    // Check auth status and redirect accordingly
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Redirect to dashboard if authenticated, otherwise to auth page
        if (session) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/auth";
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Redirect to auth page on error
        window.location.href = "/auth";
      }
    };
    
    checkAuthAndRedirect();
  }, []);

  // Show a simple loading message while checking auth
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h1>Fortnite Analyzer</h1>
        <p>Loading application...</p>
      </div>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f5f8ff;
        }
        
        .loading-content {
          text-align: center;
          padding: 32px;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #4285f4;
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        h1 {
          color: #4285f4;
          font-size: 2rem;
          margin: 0 0 12px;
        }
        
        p {
          color: #666;
          font-size: 1rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
