"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, signOut } from "../../utils/supabaseClient";
import ProfileForm from "../../components/ProfileForm";
import MapSearchForm from "../../components/MapSearchForm";
import IslandDetails from "../../components/IslandDetails";
import FortniteStatsCard from "../../components/FortniteStatsCard";
import PlayerStatsChart from "../../components/PlayerStatsChart";
import PredictionResults from "../../components/PredictionResults";
import useProfile from "../../hooks/useProfile";
import useFortniteData from "../../hooks/useFortniteData";
import { ProfileFormData, IslandData, PlayerStat, TableData } from "../../types";
import DatabaseInitializer from "../../components/DatabaseInitializer";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("search");
  
  // Initialize custom hooks
  const fortniteData = useFortniteData();
  const { profile, isLoading: profileLoading, isSaving: profileSaving, 
          error: profileError, successMessage: profileSuccess, updateProfile } = 
    useProfile({ 
      userId: user?.id || '', 
      onError: (msg) => console.error("Profile error:", msg) 
    });

  // Check if user is authenticated
  // useEffect(() => {
  //   const checkUser = async () => {
  //     try {
  //       const { data: { session } } = await supabase.auth.getSession();
        
  //       if (!session) {
  //         router.push("/auth");
  //         return;
  //       }
        
  //       setUser(session.user);
  //     } catch (error) {
  //       console.log('Session check error:', error);
  //       router.push("/auth");
  //     }
  //   };
    
  //   // checkUser();
    
  //   // Listen for auth changes
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  //     if (event === 'SIGNED_OUT') {
  //       window.location.href = "/auth";
  //     }
  //   });
    
  //   return () => subscription.unsubscribe();
  // }, [router]);

  // Handle sign out
  async function handleSignOut() {
    try {
      await signOut();
      window.location.href = "/auth";
    } catch (error) {
      console.log('Sign out exception:', error);
      window.location.href = "/auth";
    }
  }

  // Handle profile update
  async function handleProfileUpdate(formData: ProfileFormData): Promise<boolean> {
    if (!user) return false;
    return await updateProfile(formData);
  }

  // Process player stats into a format for the FortniteStatsCard component
  function getPlayerStats(): PlayerStat[] {
    if (!fortniteData.scrapeData || !fortniteData.scrapeData[0] || !fortniteData.scrapeData[0].player_stats) {
      return [];
    }
    
    return fortniteData.scrapeData[0].player_stats.map((stat: any) => ({
      stat_label: stat.stat_label || "Unknown Stat",
      stat_value: stat.stat_value || "N/A"
    }));
  }

  // Get the table data for the chart
  function getTableData(): TableData {
    if (!fortniteData.scrapeData || !fortniteData.scrapeData[0]) {
      return { header: [], rows: [] };
    }
    
    // If table_data is already available, use it
    if (fortniteData.scrapeData[0].table_data) {
      return fortniteData.scrapeData[0].table_data;
    }
    
    // If we have table_rows, convert them to the format needed for the chart
    if (fortniteData.scrapeData[0].table_rows && fortniteData.scrapeData[0].table_rows.length > 0) {
      // Get column headers from first row object keys
      const keys = Object.keys(fortniteData.scrapeData[0].table_rows[0]);
      
      // Create rows data
      const rows = fortniteData.scrapeData[0].table_rows.map((row: Record<string, string>) => {
        return keys.map(key => row[key]);
      });
      
      return {
        header: keys,
        rows
      };
    }
    
    return { header: [], rows: [] };
  }

  // Get the island data
  function getIslandData(): IslandData {
    if (!fortniteData.scrapeData || !fortniteData.scrapeData[0]) {
      return {};
    }
    
    return {
      title: fortniteData.scrapeData[0].title,
      code: fortniteData.scrapeData[0].code,
      creator: fortniteData.scrapeData[0].creator,
      description: fortniteData.scrapeData[0].description,
      tags: fortniteData.scrapeData[0].tags,
      creator_code: fortniteData.scrapeData[0].creator_code,
      published_date: fortniteData.scrapeData[0].published_date,
      version: fortniteData.scrapeData[0].version
    };
  }

  // Render initial profile data that will be passed to ProfileForm
  function getInitialProfileData(): ProfileFormData {
    if (profile) {
      return {
        display_name: profile.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
        bio: profile.bio || ""
      };
    }
    
    return {
      display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
      bio: ""
    };
  }

  return (
    <div className="dashboard-container">
      <DatabaseInitializer />
      
      <header className="dashboard-header">
        <div className="logo-container">
          <h1>Fortnite Analyzer</h1>
        </div>
        <div className="user-container">
          <span className="username">{profile?.display_name || user?.email?.split('@')[0]}</span>
          <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
        </div>
      </header>
      
      <div className="tab-container">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Island Search
        </button>
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>
      
      <main className="dashboard-content">
        {activeTab === 'search' ? (
          <div className="search-tab">
            <section className="search-section">
              <h2>Search for a Fortnite Island</h2>
              <p>Enter a Fortnite island code to analyze its player stats and get recommendations</p>
              
              <MapSearchForm 
                onSubmit={fortniteData.fetchMapData} 
                loading={fortniteData.isLoading} 
                errorMessage={fortniteData.error} 
              />
            </section>
            
            {fortniteData.scrapeData && fortniteData.scrapeData[0] && (
              <>
                <section className="results-section">
                  <IslandDetails islandData={getIslandData()} />
                  
                  <FortniteStatsCard 
                    title="Player Statistics" 
                    stats={getPlayerStats()} 
                  />
                  
                  <PlayerStatsChart tableData={getTableData()} />
                </section>
                
                <section className="predictions-section">
                  <div className="prediction-header">
                    <h2>Player Count Predictions</h2>
                    {!fortniteData.predictions && !fortniteData.isPredicting && (
                      <button 
                        onClick={() => {
                          console.log("Generating predictions...");
                          fortniteData.generatePredictions();
                        }} 
                        className="generate-btn"
                        disabled={fortniteData.isPredicting}
                      >
                        {fortniteData.isPredicting ? 'Generating...' : 'Generate Predictions'}
                      </button>
                    )}
                  </div>
                  
                  {fortniteData.isPredicting && (
                    <div className="prediction-loading">
                      <p>Generating predictions...</p>
                    </div>
                  )}
                  
                  {fortniteData.error && !fortniteData.isLoading && (
                    <div className="prediction-error">
                      <p>{fortniteData.error}</p>
                    </div>
                  )}
                  
                  {fortniteData.predictions && (
                    <>
                      <PredictionResults predictions={fortniteData.predictions} />
                      <div className="regenerate-container">
                        <button
                          onClick={() => {
                            console.log("Regenerating predictions...");
                            fortniteData.generatePredictions();
                          }}
                          className="regenerate-btn"
                          disabled={fortniteData.isPredicting}
                        >
                          {fortniteData.isPredicting ? 'Regenerating...' : 'Regenerate Predictions'}
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        ) : (
          <div className="profile-tab">
            <section className="profile-section">
              <h2>Your Profile</h2>
              <p>Manage your profile information</p>
              
              {user && (
                <ProfileForm 
                  initialData={getInitialProfileData()} 
                  userId={user.id}
                  onUpdate={handleProfileUpdate}
                  isLoading={profileLoading || profileSaving}
                  errorMessage={profileError}
                  successMessage={profileSuccess}
                />
              )}
            </section>
          </div>
        )}
      </main>
      
      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          margin-bottom: 24px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .logo-container h1 {
          margin: 0;
          font-size: 1.8rem;
          color: #4285f4;
        }
        
        .user-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .username {
          font-weight: 500;
        }
        
        .sign-out-btn {
          padding: 8px 16px;
          background-color: transparent;
          color: #d93025;
          border: 1px solid #d93025;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .sign-out-btn:hover {
          background-color: #fce8e6;
        }
        
        .tab-container {
          display: flex;
          margin-bottom: 24px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .tab-button {
          padding: 12px 24px;
          background-color: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          font-size: 16px;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tab-button.active {
          color: #4285f4;
          border-bottom-color: #4285f4;
        }
        
        .dashboard-content {
          min-height: 500px;
        }
        
        .search-section,
        .profile-section {
          margin-bottom: 32px;
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 8px;
          color: #333;
        }
        
        p {
          margin-top: 0;
          margin-bottom: 16px;
          color: #666;
        }
        
        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .generate-btn {
          padding: 10px 20px;
          background-color: #34a853;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .generate-btn:hover:not(:disabled) {
          background-color: #2d9249;
        }
        
        .generate-btn:disabled {
          background-color: #a3d9b1;
          cursor: not-allowed;
        }
        
        .prediction-loading {
          text-align: center;
          padding: 40px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        .prediction-error {
          padding: 16px;
          background-color: #fce8e6;
          color: #d93025;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .regenerate-container {
          display: flex;
          justify-content: center;
          margin-top: -12px;
          margin-bottom: 24px;
        }
        
        .regenerate-btn {
          padding: 8px 16px;
          background-color: #5f6368;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .regenerate-btn:hover:not(:disabled) {
          background-color: #4a4d51;
        }
        
        .regenerate-btn:disabled {
          background-color: #d5d7d8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
