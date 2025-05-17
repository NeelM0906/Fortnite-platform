#!/usr/bin/env python3
"""
Fortnite Platform Dashboard

A Streamlit dashboard for visualizing Fortnite island statistics.

Usage:
    streamlit run dashboard.py

Dependencies: streamlit, plotly, pandas, supabase
"""
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import json
import os
import subprocess
import sys
import urllib.parse
import time
import logging
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet

# Configure logging
logging.basicConfig(level=logging.INFO)

# Import common utilities for accessing project paths
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.utils.common import get_output_dir, safe_load_json
from src.utils.supabase_client import get_supabase_client

# Initialize Supabase client
supabase = get_supabase_client()

# Page configuration - MUST BE FIRST Streamlit command
st.set_page_config(
    page_title="Fortnite Island Analytics",
    page_icon="🎮",
    layout="wide",
    initial_sidebar_state="expanded"
)

# NOW you can add debug info (after set_page_config)
if os.environ.get("DEBUG"):
    st.write("Debug info:")
    st.write(f"Session state keys: {st.session_state.keys()}")
    st.write(f"Auth status: {'Authenticated' if 'authenticated' in st.session_state and st.session_state.authenticated else 'Not authenticated'}")
    st.write(f"Query params: {st.query_params}")

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #5643CC;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1.5rem;
        color: #888;
        margin-top: 0;
    }
    .stat-card {
        background-color: #f8f9fa;
        border-radius: 5px;
        padding: 15px;
        box-shadow: 0 0 5px rgba(0,0,0,0.1);
    }
    .highlight {
        color: #5643CC;
        font-weight: bold;
    }
    .auth-form {
        background-color: #f8f9fa;
        border-radius: 5px;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }
    .profile-card {
        background-color: #f8f9fa;
        border-radius: 5px;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }
    .stButton>button {
        width: 100%;
    }
</style>
""", unsafe_allow_html=True)

# Initialize authentication state variables
if 'authenticated' not in st.session_state:
    st.session_state.authenticated = False
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
if 'user_email' not in st.session_state:
    st.session_state.user_email = None
if 'profile' not in st.session_state:
    st.session_state.profile = None
if 'auth_message' not in st.session_state:
    st.session_state.auth_message = None
if 'auth_status' not in st.session_state:
    st.session_state.auth_status = None

# Authentication functions
def check_auth_state():
    """Check for authentication state on page load and handle auth tokens from URL"""
    try:
        # Check if there's an access token in the URL (happens after magic link redirect)
        query_params = st.query_params
        if "access_token" in query_params:
            # Extract tokens from URL
            access_token = query_params["access_token"]
            refresh_token = query_params.get("refresh_token", "")
            
            # Set the session with the tokens from the URL
            supabase.supabase.auth.set_session(access_token, refresh_token)
            
            # Clear tokens from URL (for security)
            st.query_params.clear()
            
            # Mark as authenticated
            st.session_state.authenticated = True
            st.session_state.auth_message = "Successfully logged in via magic link"
            st.session_state.auth_status = "success"
            st.session_state.auth_changed = True
            
            # Get user details
            user = supabase.get_user()
            if user:
                st.session_state.user_id = user.id
                st.session_state.user_email = user.email
                
                # Get user profile
                profile = supabase.get_profile(user.id)
                if profile:
                    st.session_state.profile = profile
                
                print(f"Successfully authenticated user: {user.email}")
                return True
        
        # If no tokens in URL, try to get session from Supabase
        session = supabase.get_session()
        if session:
            user = supabase.get_user()
            if user:
                st.session_state.authenticated = True
                st.session_state.user_id = user.id
                st.session_state.user_email = user.email
                
                # Get user profile
                profile = supabase.get_profile(user.id)
                if profile:
                    st.session_state.profile = profile
                
                print(f"Got existing session for user: {user.email}")
                return True
    except Exception as e:
        print(f"Error checking auth state: {str(e)}")
    
    print("No valid authentication found")
    return False

def init_auth_state():
    """Initialize authentication state variables in session state"""
    if 'authenticated' not in st.session_state:
        st.session_state.authenticated = False
    if 'user_id' not in st.session_state:
        st.session_state.user_id = None
    if 'user_email' not in st.session_state:
        st.session_state.user_email = None
    if 'profile' not in st.session_state:
        st.session_state.profile = None
    if 'auth_message' not in st.session_state:
        st.session_state.auth_message = None
    if 'auth_status' not in st.session_state:
        st.session_state.auth_status = None
    
    # Check for existing authentication
    if not st.session_state.authenticated:
        check_auth_state()

def sign_out():
    """Sign out the current user"""
    if supabase.sign_out():
        st.session_state.authenticated = False
        st.session_state.user_id = None
        st.session_state.user_email = None
        st.session_state.profile = None
        st.session_state.auth_message = "Signed out successfully"
        st.session_state.auth_status = "success"
        return True
    
    st.session_state.auth_message = "Sign out failed"
    st.session_state.auth_status = "error"
    return False

def update_profile(display_name, bio):
    """Update user profile"""
    if not st.session_state.authenticated or not st.session_state.user_id:
        st.session_state.auth_message = "You must be logged in to update your profile"
        st.session_state.auth_status = "error"
        return False
    
    # Validate input
    if len(bio) < 5:
        st.session_state.auth_message = "Bio must be at least 5 characters"
        st.session_state.auth_status = "error"
        return False
        
    profile_data = {
        "display_name": display_name,
        "bio": bio,
        "updated_at": datetime.now().isoformat()
    }
    
    # Log the update attempt
    print(f"Updating profile for user {st.session_state.user_id}")
    print(f"Profile data: {profile_data}")
    
    # Attempt to update profile
    update_result = supabase.update_profile(st.session_state.user_id, profile_data)
    print(f"Update result: {update_result}")
    
    if update_result:
        # Refresh profile in session state
        profile = supabase.get_profile(st.session_state.user_id)
        print(f"Retrieved profile after update: {profile}")
        
        if profile:
            st.session_state.profile = profile
            print(f"Updated session state profile: {st.session_state.profile}")
        
        st.session_state.auth_message = "Profile updated successfully"
        st.session_state.auth_status = "success"
        st.session_state.auth_changed = True  # Trigger a rerun to refresh the UI
        return True
    
    st.session_state.auth_message = "Profile update failed"
    st.session_state.auth_status = "error"
    return False

def safe_int(val):
    """
    Safely convert a string to int, handling commas, 'K', and invalid values.
    Args:
        val (str): Value to convert.
    Returns:
        int or None: Integer value or None if conversion fails.
    """
    if not val or val == '-':
        return 0
    try:
        # Handle "K" for thousands
        if isinstance(val, str) and 'K' in val:
            return int(float(val.replace(',', '').replace('K', '')) * 1000)
        return int(val.replace(',', '').split()[0])
    except Exception:
        return 0

def clean_time_label(time_str):
    """
    Clean and simplify time labels to avoid overlap in charts.
    
    Args:
        time_str (str): Time string in format like "20:00 - 21:00"
        
    Returns:
        str: Simplified time label
    """
    if not time_str or time_str == "":
        return "Total"
        
    # Extract just the starting hour for a cleaner display
    if " - " in time_str:
        start_time = time_str.split(" - ")[0]
        if ":" in start_time:
            # Convert 24h format to more readable format
            hour = int(start_time.split(":")[0])
            if hour == 0:
                return "12 AM"
            elif hour < 12:
                return f"{hour} AM"
            elif hour == 12:
                return "12 PM"
            else:
                return f"{hour-12} PM"
        return start_time
    return time_str

def run_analysis(map_code):
    """
    Run the main.py script to analyze the given map code and return the path to the output JSON file.
    
    Args:
        map_code (str): The Fortnite island code to analyze
        
    Returns:
        str: Path to the output JSON file
    """
    with st.spinner("Analyzing map data... This may take a minute..."):
        result = subprocess.run(
            [sys.executable, "main.py", map_code], 
            capture_output=True, 
            text=True
        )
        
        # Extract the JSON path from the output
        try:
            output_lines = result.stdout.splitlines()
            json_path_line = [line for line in output_lines if "Consolidated data saved to" in line][0]
            json_path = json_path_line.split(": ")[1].strip()
            return json_path
        except (IndexError, AttributeError):
            st.error("Failed to extract output JSON path. Check console output for errors.")
            st.code(result.stdout)
            st.code(result.stderr)
            return None

def load_existing_data():
    """
    Load existing analysis files from the output directory
    
    Returns:
        list: List of tuples containing (filename, path, timestamp, map_code)
    """
    output_dir = get_output_dir()
    files = []
    
    if not os.path.exists(output_dir):
        return files
        
    for file in os.listdir(output_dir):
        if file.startswith("fortnite_data_") and file.endswith(".json"):
            try:
                parts = file.replace("fortnite_data_", "").replace(".json", "").split("_")
                map_code = parts[0]
                timestamp = "_".join(parts[1:])
                filepath = os.path.join(output_dir, file)
                
                # Try to parse timestamp
                try:
                    dt = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
                    formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
                except:
                    formatted_time = timestamp
                    
                files.append((file, filepath, formatted_time, map_code))
            except:
                # Skip files that don't match expected pattern
                continue
                
    # Sort by timestamp (newest first)
    return sorted(files, key=lambda x: x[0], reverse=True)

def display_island_info(data):
    """Display general information about the Fortnite island"""
    api_data = data.get("api_data", {})
    if not api_data:
        st.warning("No API data available for this island")
        return
        
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Island Details")
        st.markdown(f"**Title:** {api_data.get('title', 'N/A')}")
        st.markdown(f"**Creator:** {api_data.get('creator', 'N/A')}")
        st.markdown(f"**Description:**")
        st.markdown(f"*{api_data.get('description', 'No description available')}*")
        
    with col2:
        st.subheader("Additional Information")
        st.markdown(f"**Code:** {api_data.get('code', 'N/A')}")
        st.markdown(f"**Published:** {api_data.get('publishedDate', 'N/A')}")
        st.markdown(f"**Version:** {api_data.get('version', 'N/A')}")
        
        # Display tags if available
        tags = api_data.get('tags', [])
        if tags:
            st.markdown("**Tags:**")
            tags_html = " ".join([f"<span style='background-color:#e6f7ff;border-radius:3px;padding:2px 6px;margin:2px;font-size:0.8em'>{tag}</span>" for tag in tags])
            st.markdown(tags_html, unsafe_allow_html=True)

def display_player_stats(data):
    """Display player statistics from scraped data"""
    scraped_data = data.get("scraped_data", {})
    if not scraped_data:
        st.warning("No scraped data available for this island")
        return
        
    # Fix: Handle the case when scraped_data is a list (take the first item)
    if isinstance(scraped_data, list) and scraped_data:
        scraped_data = scraped_data[0]
    elif isinstance(scraped_data, list) and not scraped_data:
        st.warning("No player data available")
        return
        
    player_stats = scraped_data.get("player_stats", [])
    if not player_stats:
        st.warning("No player stats available for this island")
        return
        
    # Display player stats in cards
    st.subheader("Player Statistics")
    
    # Create columns for stats
    cols = st.columns(len(player_stats))
    
    for i, stat in enumerate(player_stats):
        label = stat.get("stat_label", "").strip()
        value = stat.get("stat_value", "").strip()
        with cols[i]:
            st.markdown(f"""
            <div class='stat-card'>
                <div style='font-size:2rem;font-weight:bold;color:#5643CC'>{value}</div>
                <div style='color:#888;font-size:0.9rem'>{label}</div>
            </div>
            """, unsafe_allow_html=True)

def forecast_player_trends(df, periods=24):
    """
    Forecast future player trends using Prophet time series model.
    
    Args:
        df (DataFrame): DataFrame with historical player data
        periods (int): Number of future periods to predict
        
    Returns:
        DataFrame: DataFrame with historical + forecast data
    """
    try:
        # Convert time strings to datetime objects for prophet
        # First, create a reference date (today) to attach the hour data to
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Create a forecast dataframe in the format Prophet expects
        forecast_df = pd.DataFrame()
        
        # Parse hour from the time strings and create datetime objects
        times = []
        for time_str in df["Original Time"]:
            # Try to extract hour from format like "20:00 - 21:00"
            if "-" in time_str:
                hour_str = time_str.split("-")[0].strip()
                if ":" in hour_str:
                    hour = int(hour_str.split(":")[0])
                    times.append(today + timedelta(hours=hour))
                else:
                    # If time format is unexpected, use a sequential time
                    times.append(today + timedelta(hours=len(times)))
            else:
                # Handle other formats or use a sequential approach
                times.append(today + timedelta(hours=len(times)))
        
        forecast_df["ds"] = times
        forecast_df["y"] = df["Peak Players"]
        
        # Train a Prophet model
        model = Prophet(
            daily_seasonality=True,
            yearly_seasonality=False,
            weekly_seasonality=True,
            changepoint_prior_scale=0.05,
            interval_width=0.9
        )
        model.fit(forecast_df)
        
        # Create a dataframe for future periods
        future = model.make_future_dataframe(periods=periods, freq='H')
        
        # Predict
        forecast = model.predict(future)
        
        # Format the results
        results = pd.DataFrame()
        results["ds"] = forecast["ds"]
        results["Actual"] = None
        
        # Add actual values where we have them
        for i, row in forecast_df.iterrows():
            mask = results["ds"] == row["ds"]
            results.loc[mask, "Actual"] = row["y"]
        
        results["Predicted"] = np.round(forecast["yhat"], 0)
        results["Lower Bound"] = np.round(forecast["yhat_lower"], 0)
        results["Upper Bound"] = np.round(forecast["yhat_upper"], 0)
        
        # Format time for display
        results["Time"] = results["ds"].dt.strftime("%H:00")
        results["Date"] = results["ds"].dt.strftime("%Y-%m-%d")
        results["DateTime"] = results["Date"] + " " + results["Time"]
        
        # Mark which rows are historical vs forecast
        results["Type"] = "Forecast"
        for i, row in results.iterrows():
            if pd.notnull(row["Actual"]):
                results.loc[i, "Type"] = "Historical"
        
        return results
    except Exception as e:
        st.error(f"Forecasting error: {str(e)}")
        # Return empty dataframe if forecasting fails
        return pd.DataFrame()

def display_player_charts(data):
    """Display player charts from scraped data"""
    scraped_data = data.get("scraped_data", {})
    if not scraped_data:
        return
        
    # Fix: Handle the case when scraped_data is a list (take the first item)
    if isinstance(scraped_data, list) and scraped_data:
        scraped_data = scraped_data[0]
    elif isinstance(scraped_data, list) and not scraped_data:
        st.warning("No player data available for chart visualization")
        return
        
    table_rows = scraped_data.get("table_rows", [])
    if not table_rows:
        st.warning("No table data available for chart visualization")
        return
        
    # Prepare data for charts
    times, peaks, avgs, gains = [], [], [], []
    for row in table_rows:
        t = row.get("time")
        p = safe_int(row.get("peak", ""))
        a = safe_int(row.get("average", ""))
        g = safe_int(row.get("gain", ""))
        
        if t:
            times.append(t)
            peaks.append(p)
            avgs.append(a)
            gains.append(g)
            
    if not times:
        st.warning("No valid time-series data available for chart visualization")
        return
        
    # Clean time labels to avoid overlapping
    cleaned_times = [clean_time_label(t) for t in times]
        
    # Create indices for sequential x-axis positioning 
    # (instead of using time values directly which can cause wrapping issues)
    indices = list(range(len(times)))
    
    # Create a DataFrame for easier manipulation
    df = pd.DataFrame({
        "Index": indices,
        "Time": cleaned_times,  # Use cleaned times
        "Original Time": times,  # Keep original times for reference
        "Peak Players": peaks,
        "Average Players": avgs,
        "Player Gain": gains
    })
    
    st.subheader("Player Trends Over Time")
    
    tab1, tab2, tab3 = st.tabs(["Players Over Time", "Peak vs Average", "Trend Prediction"])
    
    with tab1:
        # Line chart for players over time - using indices for x-axis
        fig1 = go.Figure()
        fig1.add_trace(go.Scatter(x=df["Index"], y=df["Peak Players"], mode="lines+markers", name="Peak Players", line=dict(color="#5643CC", width=3)))
        fig1.add_trace(go.Scatter(x=df["Index"], y=df["Average Players"], mode="lines+markers", name="Average Players", line=dict(color="#54C6EB", width=3)))
        
        # Improve chart layout to avoid overlapping
        fig1.update_layout(
            title="Player Count Over Time",
            xaxis_title="Time Period",
            yaxis_title="Player Count",
            legend_title="Legend",
            height=500,
            margin=dict(l=20, r=20, t=40, b=100),  # Increase bottom margin for labels
            paper_bgcolor="white",
            plot_bgcolor="white",
            font=dict(family="Arial, sans-serif", size=12),
            xaxis=dict(
                showgrid=True, 
                gridcolor="#eee",
                tickangle=-45,  # Angled labels for better readability
                tickmode='array',
                tickvals=df["Index"].tolist(),  # Use indices
                ticktext=df["Original Time"].tolist()  # But show time labels
            ),
            yaxis=dict(showgrid=True, gridcolor="#eee")
        )
        
        # Adjust tick density based on number of data points
        if len(df) > 12:
            # Only show every other time label if there are many
            fig1.update_layout(
                xaxis=dict(
                    showgrid=True, 
                    gridcolor="#eee",
                    tickangle=-45,
                    tickmode='array',
                    tickvals=df["Index"].tolist()[::2],  # Show every other index
                    ticktext=df["Original Time"].tolist()[::2]  # Show every other label
                )
            )
            
        st.plotly_chart(fig1, use_container_width=True)
        
        # Display table below the chart
        st.subheader("Player Count Data")
        display_df = df.copy()
        display_df = display_df[["Original Time", "Peak Players", "Average Players", "Player Gain"]]
        display_df.columns = ["Time Period", "Peak Players", "Average Players", "Player Gain"]
        st.dataframe(display_df, use_container_width=True, height=300)
        
    with tab2:
        # Bar chart comparing peak vs average - using indices for x-axis
        fig2 = go.Figure()
        bar_width = 0.4
        
        # Add bars for peak players
        fig2.add_trace(go.Bar(
            x=df["Index"],  # Use indices
            y=df["Peak Players"],
            name="Peak Players",
            marker_color="#5643CC",
            width=bar_width,
            offset=-bar_width/2
        ))
        
        # Add bars for average players
        fig2.add_trace(go.Bar(
            x=df["Index"],  # Use indices
            y=df["Average Players"],
            name="Average Players",
            marker_color="#54C6EB",
            width=bar_width,
            offset=bar_width/2
        ))
        
        # Improve chart layout to avoid overlapping
        fig2.update_layout(
            title="Peak vs Average Players",
            xaxis_title="Time Period",
            yaxis_title="Player Count",
            legend_title="Legend",
            height=500,
            barmode="group",
            margin=dict(l=20, r=20, t=40, b=100),  # Increase bottom margin for labels
            paper_bgcolor="white",
            plot_bgcolor="white",
            font=dict(family="Arial, sans-serif", size=12),
            xaxis=dict(
                showgrid=True, 
                gridcolor="#eee",
                tickangle=-45,  # Angled labels for better readability
                tickmode='array',
                tickvals=df["Index"].tolist(),  # Use indices
                ticktext=df["Original Time"].tolist()  # But show time labels
            ),
            yaxis=dict(showgrid=True, gridcolor="#eee")
        )
        
        # Adjust tick density based on number of data points
        if len(df) > 12:
            # Only show every other time label if there are many
            fig2.update_layout(
                xaxis=dict(
                    showgrid=True, 
                    gridcolor="#eee",
                    tickangle=-45,
                    tickmode='array',
                    tickvals=df["Index"].tolist()[::2],  # Show every other index
                    ticktext=df["Original Time"].tolist()[::2]  # Show every other label
                )
            )
            
        st.plotly_chart(fig2, use_container_width=True)
        
        # Display comparison table below the chart
        st.subheader("Peak vs Average Comparison Data")
        compare_df = df.copy()
        compare_df = compare_df[["Original Time", "Peak Players", "Average Players"]]
        compare_df["Difference"] = compare_df["Peak Players"] - compare_df["Average Players"]
        compare_df["Ratio"] = round(compare_df["Peak Players"] / compare_df["Average Players"], 2)
        compare_df.columns = ["Time Period", "Peak Players", "Average Players", "Difference", "Peak/Avg Ratio"]
        st.dataframe(compare_df, use_container_width=True, height=300)
        
    with tab3:
        st.subheader("Player Count Prediction")
        
        # Check if we have enough data for forecasting (at least 3 data points)
        if len(df) >= 3:
            # Get forecast data
            with st.spinner("Generating player count predictions..."):
                forecast_periods = st.slider("Forecast Hours", min_value=6, max_value=48, value=24, step=6)
                forecast_data = forecast_player_trends(df, periods=forecast_periods)
                
                if not forecast_data.empty:
                    # Plot both historical and forecast data
                    fig3 = go.Figure()
                    
                    # Add historical data
                    historical = forecast_data[forecast_data["Type"] == "Historical"]
                    forecast = forecast_data[forecast_data["Type"] == "Forecast"]
                    
                    # Add historical line
                    fig3.add_trace(go.Scatter(
                        x=historical["DateTime"], 
                        y=historical["Actual"],
                        mode="lines+markers", 
                        name="Historical", 
                        line=dict(color="#5643CC", width=3)
                    ))
                    
                    # Add forecast line
                    fig3.add_trace(go.Scatter(
                        x=forecast["DateTime"], 
                        y=forecast["Predicted"],
                        mode="lines", 
                        name="Forecast", 
                        line=dict(color="#FF9933", width=3, dash="dash")
                    ))
                    
                    # Add confidence interval
                    fig3.add_trace(go.Scatter(
                        x=forecast["DateTime"].tolist() + forecast["DateTime"].tolist()[::-1],
                        y=forecast["Upper Bound"].tolist() + forecast["Lower Bound"].tolist()[::-1],
                        fill='toself',
                        fillcolor='rgba(255, 153, 51, 0.2)',
                        line=dict(color='rgba(255, 153, 51, 0)'),
                        name='Confidence Interval'
                    ))
                    
                    # Improve chart layout
                    fig3.update_layout(
                        title="Player Count Prediction",
                        xaxis_title="Time",
                        yaxis_title="Player Count",
                        legend_title="Legend",
                        height=500,
                        margin=dict(l=20, r=20, t=40, b=100),
                        paper_bgcolor="white",
                        plot_bgcolor="white",
                        font=dict(family="Arial, sans-serif", size=12),
                        xaxis=dict(
                            showgrid=True, 
                            gridcolor="#eee",
                            tickangle=-45
                        ),
                        yaxis=dict(showgrid=True, gridcolor="#eee")
                    )
                    
                    # Show the chart
                    st.plotly_chart(fig3, use_container_width=True)
                    
                    # Show a table with the forecast data
                    st.subheader("Forecast Data")
                    forecast_table = forecast.copy()
                    forecast_table = forecast_table[["DateTime", "Predicted", "Lower Bound", "Upper Bound"]]
                    forecast_table.columns = ["Time", "Predicted Players", "Lower Bound", "Upper Bound"]
                    st.dataframe(forecast_table, use_container_width=True, height=300)
                    
                    # Add interpretation
                    peak_time = forecast["DateTime"][forecast["Predicted"].idxmax()]
                    peak_players = int(forecast["Predicted"].max())
                    
                    st.info(f"**Prediction Summary:** Peak player count of approximately **{peak_players}** players expected around **{peak_time}**.")
                    
                    st.caption("Note: Predictions are based on limited historical data and should be interpreted as estimates.")
                else:
                    st.warning("Unable to generate forecast with the available data.")
        else:
            st.warning("At least 3 data points are needed for time series forecasting. Please collect more data.")

def show_auth_forms():
    """Display authentication forms with email/password login and registration"""
    tab1, tab2 = st.tabs(["Sign In", "Sign Up"])
    
    with tab1:
        st.markdown("<div class='auth-form'>", unsafe_allow_html=True)
        st.subheader("Sign In with Email & Password")
        
        email = st.text_input("Email", key="login_email", 
                             placeholder="Enter your email address")
        password = st.text_input("Password", key="login_password", 
                               type="password", placeholder="Enter your password")
        
        if st.button("Sign In", key="sign_in_button", type="primary"):
            if not email or '@' not in email:
                st.error("Please enter a valid email address")
            elif not password:
                st.error("Please enter your password")
            else:
                result = supabase.sign_in(email, password)
                if result.get("user"):
                    # Successfully signed in
                    st.session_state.authenticated = True
                    st.session_state.user_id = result["user"].id
                    st.session_state.user_email = result["user"].email
                    
                    # Get user profile
                    profile = supabase.get_profile(result["user"].id)
                    if profile:
                        st.session_state.profile = profile
                    
                    st.session_state.auth_message = "Successfully signed in!"
                    st.session_state.auth_status = "success"
                    st.session_state.auth_changed = True
                    st.rerun()
                else:
                    st.error(f"Login failed: {result.get('error', 'Invalid email or password')}")
        
        st.markdown("</div>", unsafe_allow_html=True)
            
    with tab2:
        st.markdown("<div class='auth-form'>", unsafe_allow_html=True)
        st.subheader("Create a New Account")
        
        email = st.text_input("Email", key="register_email", 
                             placeholder="Enter your email address")
        password = st.text_input("Password", key="register_password", 
                               type="password", placeholder="Create a password (min 6 characters)")
        password_confirm = st.text_input("Confirm Password", key="register_password_confirm", 
                                      type="password", placeholder="Confirm your password")
        
        if st.button("Sign Up", key="sign_up_button", type="primary"):
            if not email or '@' not in email:
                st.error("Please enter a valid email address")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters")
            elif password != password_confirm:
                st.error("Passwords do not match")
            else:
                result = supabase.sign_up(email, password)
                if result.get("user"):
                    # Successfully registered
                    st.session_state.authenticated = True
                    st.session_state.user_id = result["user"].id
                    st.session_state.user_email = result["user"].email
                    
                    # Get user profile
                    profile = supabase.get_profile(result["user"].id)
                    if profile:
                        st.session_state.profile = profile
                    
                    st.session_state.auth_message = "Account created successfully!"
                    st.session_state.auth_status = "success"
                    st.session_state.auth_changed = True
                    st.rerun()
                else:
                    st.error(f"Registration failed: {result.get('error', 'This email may already be registered')}")
        
        st.markdown("</div>", unsafe_allow_html=True)

def show_profile_section():
    """Display user profile section"""
    st.markdown("<div class='profile-card'>", unsafe_allow_html=True)
    st.subheader("Your Profile")
    
    # Display and edit profile
    profile = st.session_state.profile or {}
    
    # Default values if profile is empty or missing fields
    display_name = profile.get("display_name", "")
    bio = profile.get("bio", "")
    created_at = profile.get("created_at", "")
    
    # Format created_at date if available
    if created_at:
        try:
            # Try to parse ISO format
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            created_at = dt.strftime("%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError):
            # If parsing fails, use as is
            pass
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"**Email:** {st.session_state.user_email}")
        st.markdown(f"**Member since:** {created_at or 'N/A'}")
        
        # Show current profile data
        if bio:
            st.subheader("Current Bio:")
            st.info(bio)
        
        # Sign out button
        if st.button("Sign Out", key="sign_out_button"):
            sign_out()
    
    with col2:
        # Edit profile form
        new_display_name = st.text_input("Display Name", value=display_name)
        new_bio = st.text_area("Bio (min 5 characters)", value=bio, height=100, 
                              help="Tell us about yourself in at least 5 characters")
        
        if st.button("Update Profile", key="update_profile_button"):
            if update_profile(new_display_name, new_bio):
                # Force page refresh after successful update
                st.rerun()
    
    st.markdown("</div>", unsafe_allow_html=True)
    
    # Display auth messages if any
    if st.session_state.auth_message:
        if st.session_state.auth_status == "success":
            st.success(st.session_state.auth_message)
        else:
            st.error(st.session_state.auth_message)
        
        # Clear message after displaying
        st.session_state.auth_message = None
        st.session_state.auth_status = None

# ----- Main Dashboard Layout -----

# Initialize authentication state
if "auth_changed" not in st.session_state:
    st.session_state.auth_changed = False

# Call check_auth_state explicitly
# This needs to happen early in the app execution
auth_result = check_auth_state()

# Create a prominent header with auth status
col1, col2 = st.columns([3, 1])

with col1:
    st.markdown("<h1 class='main-header'>Fortnite Island Analytics</h1>", unsafe_allow_html=True)
    st.markdown("<p class='sub-header'>Visualize player statistics for Fortnite Creative Islands</p>", unsafe_allow_html=True)

with col2:
    # Prominent auth button/status
    if st.session_state.authenticated:
        st.success(f"👤 Logged in as {st.session_state.profile.get('display_name') if st.session_state.profile else st.session_state.user_email}")
        col2a, col2b = st.columns(2)
        with col2a:
            if st.button("View Profile", key="header_profile", use_container_width=True):
                st.session_state.active_tab = "Profile"
        with col2b:
            if st.button("Log Out", key="header_logout", use_container_width=True, type="secondary"):
                if sign_out():
                    st.success("Successfully logged out!")
                    st.session_state.auth_changed = True
                    st.rerun()
                else:
                    st.error("Failed to log out. Please try again.")
    else:
        st.warning("Not logged in")
        if st.button("🔑 Sign In / Sign Up", key="header_auth", use_container_width=True):
            st.session_state.active_tab = "Profile"

# Set default active tab if not set
if "active_tab" not in st.session_state:
    st.session_state.active_tab = "Dashboard"

# Main content area with tabs - Keep ONLY these tabs, remove the duplicate below
tabs = st.tabs(["Dashboard", "Profile"])
active_tab_index = 0 if st.session_state.active_tab == "Dashboard" else 1

# Sidebar for input and options
with st.sidebar:
    st.title("Controls")

    # Show auth sections based on authentication state
    if st.session_state.authenticated:
        st.subheader(f"Welcome, {st.session_state.profile.get('display_name') if st.session_state.profile else st.session_state.user_email}")
    else:
        st.info("Sign in to save your preferences and analyses")
    
    # Only show analysis options after the authentication section
    analysis_option = st.radio(
        "Choose Analysis Option",
        ["Analyze New Island", "View Existing Analysis"]
    )
    
    if analysis_option == "Analyze New Island":
        map_code = st.text_input("Enter Fortnite Map Code:", 
                                placeholder="e.g., 1865-4829-7018")
        
        analyze_button = st.button("Analyze Island", type="primary")
        
        if analyze_button and map_code:
            json_path = run_analysis(map_code)
            if json_path:
                st.success(f"Analysis complete! Loading results...")
                st.session_state.current_json_path = json_path
        
    else:  # View Existing Analysis
        existing_files = load_existing_data()
        
        if not existing_files:
            st.info("No existing analyses found. Run an analysis first.")
        else:
            st.write("Select an existing analysis:")
            
            for i, (filename, filepath, timestamp, code) in enumerate(existing_files):
                if st.button(f"{code} ({timestamp})", key=f"file_{i}"):
                    st.session_state.current_json_path = filepath

    # Show information
    st.markdown("---")
    st.markdown("### About")
    st.markdown("""
    This dashboard visualizes statistics for Fortnite Creative Islands.
    
    **Features:**
    - Fetch island data using map codes
    - View player trends over time
    - Analyze peak vs average player counts
    - Access historical analyses
    """)

# Main content using the tabs we ALREADY defined above
with tabs[0]:  # Dashboard tab
    # Main content area - load and display data
    if "current_json_path" in st.session_state and os.path.exists(st.session_state.current_json_path):
        data = safe_load_json(st.session_state.current_json_path)
        
        if data:
            # Create tabs for different aspects of the data
            dashboard_tabs = st.tabs(["Island Overview", "Player Analytics"])
            
            with dashboard_tabs[0]:
                display_island_info(data)
                
            with dashboard_tabs[1]:
                display_player_stats(data)
                display_player_charts(data)
        else:
            st.error("Failed to load data from the selected file.")
    else:
        # Default view when no analysis is loaded
        st.info("👈 Enter a Fortnite Map Code in the sidebar and click 'Analyze Island' to get started!")
        
        # Show some example map codes
        st.markdown("### Example Map Codes to Try")
        example_codes = [
            ("1865-4829-7018", "Popular Battle Royale Map"),
            ("9683-4582-8184", "Creative Zone Wars"),
            ("6531-4403-0726", "Box Fights Map")
        ]
        
        for code, description in example_codes:
            st.markdown(f"**{code}** - {description}")

with tabs[1]:  # Profile tab
    if st.session_state.authenticated:
        show_profile_section()
    else:
        show_auth_forms()

# Footer
st.markdown("---")
st.markdown("Fortnite Island Analytics Dashboard | Built with Streamlit & Plotly")

# Check if authentication state changed and we need to rerun
if st.session_state.auth_changed:
    st.session_state.auth_changed = False
    st.rerun() 