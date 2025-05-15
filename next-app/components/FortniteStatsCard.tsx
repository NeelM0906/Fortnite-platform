import React from 'react';

interface StatsData {
  stat_label: string;
  stat_value: string;
}

interface FortniteStatsCardProps {
  title: string;
  stats: StatsData[];
  className?: string;
  loading?: boolean;
}

export default function FortniteStatsCard({
  title,
  stats,
  className = '',
  loading = false,
}: FortniteStatsCardProps) {
  if (loading) {
    return (
      <div className={`stats-card ${className}`}>
        <h3>{title}</h3>
        <div className="stats-loading">
          <p>Loading stats...</p>
        </div>
        <style jsx>{`
          .stats-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            background-color: #f9f9f9;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .stats-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`stats-card ${className}`}>
      <h3>{title}</h3>
      <div className="stats-grid">
        {stats.length > 0 ? (
          stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-label">{stat.stat_label}</div>
              <div className="stat-value">{stat.stat_value}</div>
            </div>
          ))
        ) : (
          <p>No stats available</p>
        )}
      </div>
      <style jsx>{`
        .stats-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          background-color: #f9f9f9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }
        .stat-item {
          background-color: white;
          border-radius: 6px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-label {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }
      `}</style>
    </div>
  );
} 