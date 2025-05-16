"use client";
import { useEffect, useState } from "react";
import { initializeProfilesTable } from "../utils/supabaseClient";

/**
 * Database Initializer Component
 * 
 * This component ensures the Supabase profiles table is properly initialized
 * when the user loads the application. It runs in the background and handles
 * any table creation operations needed for first-time users.
 */
export default function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    // Initialize the profiles table when the component mounts
    const initialize = async () => {
      try {
        const { success, error } = await initializeProfilesTable();
        if (success) {
          console.log("Database initialization completed successfully");
          setInitialized(true);
        } else {
          console.warn("Database initialization had an issue:", error);
          // Handle the error properly with type checking
          setError(typeof error === 'object' && error !== null && 'message' in error 
            ? String(error.message) 
            : "Unknown initialization error");
        }
      } catch (err) {
        console.error("Database initialization failed:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize database");
      }
    };
    
    initialize();
  }, []);
  
  // This is a background utility component, it doesn't render anything visible
  return null;
} 