"""
Supabase client utility for authentication and data management.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables if .env file exists
if os.path.exists('.env'):
    load_dotenv()

# Fallback credentials (only used if environment variables are not set)
FALLBACK_SUPABASE_URL = "https://ryuxysblsdqxjiagwhci.supabase.co"
FALLBACK_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dXh5c2Jsc2RxeGppYWd3aGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjkxOTQsImV4cCI6MjA2Mjc0NTE5NH0.GixzXyUlTk1BinFC8hBYrVfN7hdqESx44qNPvo5bON4"

# Get Supabase credentials from environment variables with fallbacks
SUPABASE_URL = os.getenv("SUPABASE_URL", FALLBACK_SUPABASE_URL)
SUPABASE_KEY = os.getenv("SUPABASE_KEY", FALLBACK_SUPABASE_KEY)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseManager:
    """
    Manages Supabase client instance and provides authentication and data methods.
    """
    _instance = None
    
    def __new__(cls):
        """Singleton pattern to ensure only one instance is created."""
        if cls._instance is None:
            cls._instance = super(SupabaseManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
        
    def _initialize(self):
        """Initialize the Supabase client."""
        try:
            self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            self.current_user = None
            self.session = None
            logger.info(f"Supabase client initialized with URL: {SUPABASE_URL}")
        except Exception as e:
            logger.error(f"Error initializing Supabase client: {str(e)}")
            self.supabase = None
    
    def is_connected(self) -> bool:
        """Check if Supabase client is initialized."""
        return self.supabase is not None
    
    def sign_up(self, email: str, password: str) -> Dict[str, Any]:
        """
        Register a new user.
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            Dict containing user and session information
        """
        try:
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Create a profile entry for the new user
                self._create_profile(response.user.id, email.split('@')[0])
                
            return {
                "user": response.user,
                "session": response.session,
                "error": None
            }
        except Exception as e:
            logger.error(f"Sign up error: {str(e)}")
            return {"user": None, "session": None, "error": str(e)}
    
    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        """
        Sign in existing user.
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            Dict containing user and session information
        """
        try:
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            self.current_user = response.user
            self.session = response.session
            
            return {
                "user": response.user,
                "session": response.session,
                "error": None
            }
        except Exception as e:
            logger.error(f"Sign in error: {str(e)}")
            return {"user": None, "session": None, "error": str(e)}
    
    def sign_out(self) -> bool:
        """
        Sign out the current user.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.supabase.auth.sign_out()
            self.current_user = None
            self.session = None
            return True
        except Exception as e:
            logger.error(f"Sign out error: {str(e)}")
            return False
    
    def get_user(self) -> Optional[Dict[str, Any]]:
        """
        Get the current logged-in user.
        
        Returns:
            User data or None if not logged in
        """
        try:
            response = self.supabase.auth.get_user()
            if hasattr(response, 'user') and response.user:
                self.current_user = response.user
                # Log successful user retrieval for debugging
                print(f"Retrieved user data: {response.user.email}")
                return response.user
        except Exception as e:
            # Be more specific about the error
            logger.error(f"Get user error: {str(e)}")
            print(f"Failed to get user: {str(e)}")
        return None
    
    def get_session(self) -> Optional[Dict[str, Any]]:
        """
        Get the current session.
        
        Returns:
            Session data or None if not logged in
        """
        try:
            response = self.supabase.auth.get_session()
            self.session = response.session
            self.current_user = response.user
            return response.session
        except Exception as e:
            logger.error(f"Get session error: {str(e)}")
            return None
    
    def refresh_session(self) -> Optional[Dict[str, Any]]:
        """
        Refresh the current session.
        
        Returns:
            Refreshed session or None if failed
        """
        try:
            response = self.supabase.auth.refresh_session()
            self.session = response.session
            return response.session
        except Exception as e:
            logger.error(f"Refresh session error: {str(e)}")
            return None
    
    def _create_profile(self, user_id: str, display_name: str) -> bool:
        """
        Create a profile for a new user.
        
        Args:
            user_id: User's ID
            display_name: Display name for the user
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.supabase.table('profiles').insert({
                'id': user_id,
                'display_name': display_name,
                'bio': 'New Fortnite Analyzer user'
            }).execute()
            return True
        except Exception as e:
            logger.error(f"Create profile error: {str(e)}")
            return False
    
    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a user's profile.
        
        Args:
            user_id: User's ID
            
        Returns:
            Profile data or None if not found
        """
        try:
            response = self.supabase.table('profiles').select('*').eq('id', user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Get profile error: {str(e)}")
            return None
    
    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Update a user's profile.
        
        Args:
            user_id: User's ID
            profile_data: New profile data
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"Updating profile for user {user_id}")
            logger.info(f"Profile data: {profile_data}")
            
            # Make sure the profiles table exists
            self._ensure_profiles_table_exists()
            
            # Execute the update query
            response = self.supabase.table('profiles').update(profile_data).eq('id', user_id).execute()
            
            # Log the response for debugging
            logger.info(f"Supabase update response: {response}")
            
            # Check if the profile was previously created
            if not response.data or len(response.data) == 0:
                # Profile might not exist, try to create it
                logger.info(f"No existing profile found, creating new profile for user {user_id}")
                return self._create_profile_with_data(user_id, profile_data)
            
            return True
        except Exception as e:
            logger.error(f"Update profile error: {str(e)}")
            print(f"Detailed error updating profile: {str(e)}")
            return False
        
    def _ensure_profiles_table_exists(self) -> None:
        """
        Make sure the profiles table exists and has the expected schema.
        If we get permission errors, this is expected and can be ignored.
        """
        try:
            # Check if the table exists
            response = self.supabase.table('profiles').select('count(*)', count='exact').execute()
            logger.info(f"Profiles table exists with count response: {response}")
        except Exception as e:
            logger.warning(f"Error checking profiles table: {str(e)}")
            # We might not have permission to create tables, which is fine
            pass

    def _create_profile_with_data(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Create a profile for a user with specific data.
        
        Args:
            user_id: User's ID
            profile_data: Profile data to insert
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure the ID is included in the data
            insert_data = {**profile_data, 'id': user_id}
            
            # Make sure display_name exists
            if 'display_name' not in insert_data:
                insert_data['display_name'] = user_id.split('-')[0]
            
            # Make sure bio exists
            if 'bio' not in insert_data:
                insert_data['bio'] = 'New Fortnite Analyzer user'
            
            logger.info(f"Creating new profile with data: {insert_data}")
            
            # Execute the insert
            response = self.supabase.table('profiles').insert(insert_data).execute()
            logger.info(f"Profile creation response: {response}")
            
            return True
        except Exception as e:
            logger.error(f"Create profile with data error: {str(e)}")
            print(f"Detailed error creating profile: {str(e)}")
            return False
    
    def sign_in_with_magic_link(self, email: str) -> Dict[str, Any]:
        """
        Send a magic link to the user's email for passwordless login.
        
        Args:
            email: User's email
            
        Returns:
            Dict containing status and any error information
        """
        try:
            # Get the URL of the currently running Streamlit app
            site_url = os.environ.get("STREAMLIT_SERVER_BASE_URL", "http://localhost:8501")
            
            # Log the redirect URL for debugging
            print(f"Using redirect URL: {site_url}")
            
            # Send the magic link with explicit options for redirect
            self.supabase.auth.sign_in_with_otp({
                "email": email,
                "options": {
                    "email_redirect_to": site_url,
                    # Make sure tokens are included in the redirect URL
                    "should_create_user": True,
                    "data": {"app_url": site_url}
                }
            })
            
            return {
                "success": True,
                "error": None,
                "message": f"Magic link sent to {email}. Please check your email and click the link to sign in."
            }
        except Exception as e:
            logger.error(f"Magic link error: {str(e)}")
            return {"success": False, "error": str(e), "message": f"Failed to send magic link: {str(e)}"}

# Create a singleton instance
supabase_client = SupabaseManager()

def get_supabase_client() -> SupabaseManager:
    """
    Get the Supabase client instance.
    
    Returns:
        SupabaseManager instance
    """
    return supabase_client 