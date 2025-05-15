import React, { useState } from 'react';

interface MapSearchFormProps {
  onSubmit: (mapCode: string) => void;
  loading: boolean;
  errorMessage?: string;
}

export default function MapSearchForm({ 
  onSubmit, 
  loading, 
  errorMessage 
}: MapSearchFormProps) {
  const [mapCode, setMapCode] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate map code format (####-####-#### or similar)
    const mapCodePattern = /^\d{4}-\d{4}-\d{4}$/;
    if (!mapCodePattern.test(mapCode)) {
      setValidationError('Please enter a valid map code format (e.g., 6155-1398-4059)');
      return;
    }
    
    setValidationError('');
    onSubmit(mapCode);
  };

  return (
    <div className="map-search-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="mapCode">Fortnite Island Code</label>
          <div className="input-with-button">
            <input
              id="mapCode"
              type="text"
              placeholder="0000-0000-0000"
              value={mapCode}
              onChange={(e) => setMapCode(e.target.value)}
              disabled={loading}
              data-testid="map-code-input"
              aria-label="Enter Fortnite map code"
            />
            <button 
              type="submit" 
              disabled={loading || !mapCode}
              data-testid="search-button"
              aria-label="Search for map"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {validationError && <div className="error-message">{validationError}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
      </form>
      <style jsx>{`
        .map-search-form {
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
        .input-with-button {
          display: flex;
          gap: 8px;
        }
        input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #4285f4;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        button {
          padding: 10px 20px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover:not(:disabled) {
          background-color: #3367d6;
        }
        button:disabled {
          background-color: #acbfda;
          cursor: not-allowed;
        }
        .error-message {
          color: #d93025;
          font-size: 14px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
} 