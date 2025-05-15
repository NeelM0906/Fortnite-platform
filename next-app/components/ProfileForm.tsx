"use client";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";

interface ProfileData {
  display_name: string;
  bio: string;
}

interface ProfileFormProps {
  initialData: ProfileData;
  userId: string;
  onUpdate?: (data: ProfileData) => Promise<boolean>;
  isLoading?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export default function ProfileForm({ 
  initialData, 
  userId, 
  onUpdate,
  isLoading = false,
  errorMessage = "",
  successMessage = ""
}: ProfileFormProps) {
  const [profileForm, setProfileForm] = useState<ProfileData>(initialData);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Update form when initialData changes
  useEffect(() => {
    setProfileForm(initialData);
  }, [initialData]);

  // Update message from props
  useEffect(() => {
    if (errorMessage) {
      setProfileMsg(errorMessage);
    } else if (successMessage) {
      setProfileMsg(successMessage);
    }
  }, [errorMessage, successMessage]);

  // Handle profile form change 
  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    
    // For bio field, enforce the 200 character limit
    if (name === 'bio' && value.length > 200) {
      return;
    }
    
    // Clear field-specific error when field is changed
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    setProfileForm({ ...profileForm, [name]: value });
  }

  // Validate the form
  function validateForm(): boolean {
    const newErrors: {[key: string]: string} = {};
    
    if (!profileForm.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }
    
    if (profileForm.bio.length > 200) {
      newErrors.bio = 'Bio must be 200 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Update profile
  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setProfileMsg("");
    setProfileLoading(true);
    
    try {
      if (!userId) {
        throw new Error("Not authenticated");
      }
      
      if (onUpdate) {
        const success = await onUpdate(profileForm);
        if (!success) {
          throw new Error("Failed to update profile");
        }
      } else {
        // Handle the case when no onUpdate prop is provided
        setProfileMsg("Profile updated (demo mode)");
      }
    } catch (error: any) {
      console.log('Profile update issue:', error?.message || error);
      setProfileMsg(`Error: ${error?.message || "Unknown error"}`);
    } finally {
      setProfileLoading(false);
    }
  }

  const isButtonDisabled = profileLoading || isLoading;
  const showLoading = profileLoading || isLoading;

  return (
    <form onSubmit={updateProfile} className="profile-form">
      <div className="form-group">
        <label htmlFor="display_name">
          Display Name
          {errors.display_name && <span className="error-text">*</span>}
        </label>
        <input 
          id="display_name"
          name="display_name" 
          placeholder="Display Name" 
          value={profileForm.display_name} 
          onChange={handleProfileChange} 
          className={errors.display_name ? 'error' : ''}
          disabled={isButtonDisabled}
        />
        {errors.display_name && (
          <div className="error-message">{errors.display_name}</div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="bio">
          Bio <small>({profileForm.bio.length}/200 characters)</small>
          {errors.bio && <span className="error-text">*</span>}
        </label>
        <textarea 
          id="bio"
          name="bio" 
          placeholder="Tell us about yourself (max 200 characters)" 
          value={profileForm.bio} 
          onChange={handleProfileChange} 
          className={errors.bio ? 'error' : ''}
          maxLength={200}
          disabled={isButtonDisabled}
        />
        {errors.bio && (
          <div className="error-message">{errors.bio}</div>
        )}
      </div>
      
      <button 
        type="submit" 
        disabled={isButtonDisabled}
        className="update-button"
      >
        {showLoading ? "Updating..." : "Update Profile"}
      </button>
      
      {profileMsg && (
        <div className={`message ${profileMsg.includes('Error') ? 'error' : 'success'}`}>
          {profileMsg}
        </div>
      )}

      <style jsx>{`
        .profile-form {
          margin-bottom: 24px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        
        input, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #4285f4;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        
        input.error, textarea.error {
          border-color: #d93025;
        }
        
        textarea {
          height: 120px;
          resize: vertical;
        }
        
        .error-text {
          color: #d93025;
          margin-left: 4px;
        }
        
        .error-message {
          color: #d93025;
          font-size: 14px;
          margin-top: -4px;
          margin-bottom: 8px;
        }
        
        .update-button {
          padding: 10px 20px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .update-button:hover:not(:disabled) {
          background-color: #3367d6;
        }
        
        .update-button:disabled {
          background-color: #acbfda;
          cursor: not-allowed;
        }
        
        .message {
          margin-top: 12px;
          padding: 12px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .message.error {
          background-color: #fce8e6;
          color: #d93025;
        }
        
        .message.success {
          background-color: #e6f4ea;
          color: #137333;
        }
      `}</style>
    </form>
  );
} 