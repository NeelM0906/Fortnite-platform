import React from 'react';

interface IslandDetailsProps {
  islandData: {
    title?: string;
    code?: string;
    creator?: string;
    description?: string;
    tags?: string[];
    creator_code?: string;
    published_date?: string;
    version?: string;
  };
}

export default function IslandDetails({ islandData }: IslandDetailsProps) {
  if (!islandData || (!islandData.title && !islandData.code)) {
    return null;
  }

  return (
    <div className="island-details">
      <h2>{islandData.title || 'Unknown Map'}</h2>
      
      {islandData.code && (
        <div className="detail-item">
          <span className="label">Island Code:</span>
          <span className="value code">{islandData.code}</span>
        </div>
      )}
      
      {islandData.creator && (
        <div className="detail-item">
          <span className="label">Creator:</span>
          <span className="value">{islandData.creator}</span>
          {islandData.creator_code && (
            <span className="creator-code">
              (Creator Code: {islandData.creator_code})
            </span>
          )}
        </div>
      )}
      
      {islandData.description && (
        <div className="description">
          <h3>Description</h3>
          <p>{islandData.description}</p>
        </div>
      )}
      
      <div className="metadata">
        {islandData.published_date && (
          <div className="metadata-item">
            <span className="label">Published:</span>
            <span className="value">{islandData.published_date}</span>
          </div>
        )}
        
        {islandData.version && (
          <div className="metadata-item">
            <span className="label">Version:</span>
            <span className="value">{islandData.version}</span>
          </div>
        )}
      </div>
      
      {islandData.tags && islandData.tags.length > 0 && (
        <div className="tags-container">
          <span className="label">Tags:</span>
          <div className="tags">
            {islandData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .island-details {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #222;
          font-size: 1.8rem;
        }
        
        h3 {
          margin-top: 16px;
          margin-bottom: 8px;
          color: #333;
          font-size: 1.2rem;
        }
        
        .detail-item {
          margin-bottom: 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        
        .label {
          font-weight: 600;
          color: #555;
          margin-right: 4px;
        }
        
        .value {
          color: #000;
        }
        
        .code {
          background-color: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 1rem;
        }
        
        .creator-code {
          color: #666;
          font-size: 0.9rem;
          margin-left: 8px;
        }
        
        .description {
          margin: 16px 0;
          line-height: 1.6;
        }
        
        .description p {
          margin: 0;
          color: #444;
        }
        
        .metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin: 16px 0;
          font-size: 0.9rem;
        }
        
        .metadata-item {
          display: flex;
          align-items: center;
        }
        
        .tags-container {
          margin-top: 16px;
        }
        
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }
        
        .tag {
          background-color: #e8f2ff;
          color: #1a73e8;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 0.85rem;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
} 