import React, { useEffect, useState } from 'react';

export default function DatabaseInitializer() {
  const [status, setStatus] = useState<'checking' | 'initializing' | 'ready' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [sql, setSql] = useState('');

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      // First, check if the database is already initialized
      const response = await fetch('/api/init-db', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.initialized || data.tables?.profiles) {
        setStatus('ready');
        return;
      }

      // Database needs initialization
      setStatus('initializing');

      // Try to initialize the database
      const initResponse = await fetch('/api/init-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'fortnite-analyzer-setup' })
      });

      const initData = await initResponse.json();

      if (initData.success) {
        setStatus('ready');
      } else {
        setStatus('error');
        setErrorMessage(initData.message || 'Failed to initialize database');
        if (initData.sql) {
          setSql(initData.sql);
        }
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
    }
  };

  if (status === 'ready') {
    return null; // Don't show anything if the database is ready
  }

  return (
    <div className="database-initializer">
      {status === 'checking' && (
        <div className="status checking">
          <p>Checking database status...</p>
        </div>
      )}

      {status === 'initializing' && (
        <div className="status initializing">
          <p>Initializing database...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="status error">
          <p className="error-title">Database initialization failed</p>
          <p className="error-message">{errorMessage}</p>
          
          <button 
            className="toggle-details"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showDetails && sql && (
            <div className="sql-details">
              <p>Please run the following SQL in your Supabase dashboard:</p>
              <pre>{sql}</pre>
            </div>
          )}

          <button 
            className="retry-button"
            onClick={checkDatabase}
          >
            Retry
          </button>
        </div>
      )}

      <style jsx>{`
        .database-initializer {
          margin: 16px 0;
          padding: 16px;
          border-radius: 8px;
          background-color: #f8f9fa;
        }

        .status {
          padding: 16px;
          border-radius: 4px;
        }

        .checking, .initializing {
          background-color: #e8f0fe;
          color: #1a73e8;
        }

        .error {
          background-color: #fce8e6;
          color: #d93025;
        }

        .error-title {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .error-message {
          margin-bottom: 16px;
        }

        button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          margin-right: 8px;
          font-size: 14px;
        }

        .toggle-details {
          background-color: transparent;
          border: 1px solid #d93025;
          color: #d93025;
        }

        .retry-button {
          background-color: #d93025;
          color: white;
          margin-top: 16px;
        }

        .sql-details {
          margin-top: 16px;
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 4px;
          overflow-x: auto;
        }

        pre {
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
} 