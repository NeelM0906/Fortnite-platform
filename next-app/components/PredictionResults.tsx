import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PredictionPoint {
  time: string;
  value: number;
  lower?: number;
  upper?: number;
  is_prediction?: boolean;
  is_actual?: boolean;
}

interface PredictionData {
  best_player_count?: number;
  explanations?: string[];
  confidence_score?: number;
  is_simple_prediction?: boolean;
  is_hourly?: boolean;
  warning?: string;
  predictions: PredictionPoint[];
  historical?: PredictionPoint[];
  alternatives?: {
    player_count: number;
    reason: string;
  }[];
}

interface PredictionResultsProps {
  predictions: PredictionData | null;
  className?: string;
}

export default function PredictionResults({ predictions, className = '' }: PredictionResultsProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});
  
  useEffect(() => {
    // Log predictions to help debug
    console.log("Rendering predictions component with data:", predictions);
    
    // Process chart data when predictions change
    if (predictions && predictions.predictions && predictions.predictions.length > 0) {
      processChartData();
    }
  }, [predictions]);
  
  const processChartData = () => {
    if (!predictions) return;
    
    try {
      const traces = [];
      
      // Add historical data trace if available
      if (predictions.historical && predictions.historical.length > 0) {
        traces.push({
          x: predictions.historical.map(p => p.time),
          y: predictions.historical.map(p => p.value),
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Historical Data',
          line: { color: '#4285f4', width: 3 },
          marker: { size: 8 }
        });
      }
      
      // Add prediction trace
      if (predictions.predictions && predictions.predictions.length > 0) {
        const xValues = predictions.predictions.map(p => p.time);
        const yValues = predictions.predictions.map(p => p.value);
        
        traces.push({
          x: xValues,
          y: yValues,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Predictions',
          line: { color: '#34a853', width: 3, dash: 'dot' },
          marker: { size: 8 }
        });
        
        // Add confidence interval if available
        const hasConfidenceInterval = predictions.predictions.some(p => p.lower !== undefined && p.upper !== undefined);
        
        if (hasConfidenceInterval) {
          traces.push({
            x: xValues,
            y: predictions.predictions.map(p => p.lower || 0),
            type: 'scatter',
            mode: 'lines',
            name: 'Lower Bound',
            line: { width: 0 },
            marker: { color: '#34a853' },
            showlegend: false
          });
          
          traces.push({
            x: xValues,
            y: predictions.predictions.map(p => p.upper || 0),
            type: 'scatter',
            mode: 'lines',
            name: 'Upper Bound',
            fill: 'tonexty',
            fillcolor: 'rgba(52, 168, 83, 0.2)',
            line: { width: 0 },
            marker: { color: '#34a853' },
            showlegend: false
          });
        }
      }
      
      // Set chart data
      setChartData(traces);
      
      // Configure layout
      setLayout({
        title: predictions.is_hourly ? 'Hourly Player Count Predictions' : 'Daily Player Count Predictions',
        xaxis: {
          title: predictions.is_hourly ? 'Hour' : 'Date',
          tickangle: 45
        },
        yaxis: {
          title: 'Players',
          zeroline: true,
          rangemode: 'tozero',
          tickformat: ',d'
        },
        margin: { l: 60, r: 10, t: 60, b: 100 },
        autosize: true,
        showlegend: true,
        legend: {
          x: 0,
          y: 1,
          orientation: 'h',
          traceorder: 'normal'
        },
        height: 400
      });
    } catch (error) {
      console.error("Error processing prediction chart data:", error);
    }
  };

  // If no predictions data is provided at all
  if (!predictions) {
    console.warn("No predictions data received");
    return (
      <div className={`prediction-results ${className} empty-prediction`}>
        <p>No prediction data available</p>
        <style jsx>{`
          .empty-prediction {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  // If predictions object exists but is missing key required fields
  if (!predictions.predictions || predictions.predictions.length === 0 || 
      (predictions.best_player_count === undefined && !predictions.warning)) {
    console.warn("Invalid predictions data structure", predictions);
    return (
      <div className={`prediction-results ${className} empty-prediction`}>
        <p>Invalid prediction data received</p>
        <p className="error-details">Please try regenerating predictions</p>
        <style jsx>{`
          .empty-prediction {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            color: #666;
          }
          .error-details {
            font-size: 14px;
            color: #888;
            margin-top: 8px;
          }
        `}</style>
      </div>
    );
  }

  const confidence = predictions.confidence_score ? 
    (predictions.confidence_score * 100).toFixed(1) + '%' : 
    'N/A';

  const isSimplePrediction = predictions.is_simple_prediction || false;
  const bestPlayerCount = predictions.best_player_count || 100;

  // Ensure explanations is an array
  const explanationsArray = Array.isArray(predictions.explanations) 
    ? predictions.explanations 
    : [String(predictions.explanations || 'No explanation available')];

  return (
    <div className={`prediction-results ${className} ${isSimplePrediction ? 'simple-prediction' : ''}`}>
      <div className="prediction-header">
        <h3>Recommended Player Count</h3>
        {predictions.confidence_score && (
          <div className="confidence">
            Confidence: <span>{confidence}</span>
          </div>
        )}
      </div>

      <div className="main-prediction">
        <div className="best-count">
          <span className="number">{bestPlayerCount}</span>
          <span className="label">players</span>
        </div>
      </div>

      {predictions.warning && (
        <div className="warning-message">
          <p>{predictions.warning}</p>
        </div>
      )}

      <div className="explanations">
        <h4>Why this player count?</h4>
        <ul>
          {explanationsArray.map((explanation, index) => (
            <li key={index}>{explanation}</li>
          ))}
        </ul>
      </div>
      
      {chartData.length > 0 && (
        <div className="chart-container">
          <h4>Player Count Forecast</h4>
          <Plot
            data={chartData}
            layout={layout}
            config={{ responsive: true, displayModeBar: true }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {predictions.alternatives && predictions.alternatives.length > 0 && (
        <div className="alternatives">
          <h4>Alternative options</h4>
          <div className="alternatives-grid">
            {predictions.alternatives.map((alt, index) => (
              <div key={index} className="alternative-option">
                <div className="alt-count">{alt.player_count} players</div>
                <div className="alt-reason">{alt.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .prediction-results {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 24px;
        }
        
        .simple-prediction {
          background-color: #fafafa;
          border: 1px dashed #ccc;
        }
        
        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .prediction-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #333;
        }
        
        .confidence {
          background-color: #f0f4ff;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.9rem;
          color: #4285f4;
        }
        
        .confidence span {
          font-weight: bold;
        }
        
        .main-prediction {
          text-align: center;
          margin: 24px 0;
        }
        
        .best-count {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          background-color: #34a853;
          color: white;
          border-radius: 8px;
          padding: 16px 32px;
        }
        
        .best-count .number {
          font-size: 2.5rem;
          font-weight: bold;
          line-height: 1;
        }
        
        .best-count .label {
          font-size: 1rem;
          margin-top: 4px;
        }
        
        .explanations {
          margin: 24px 0;
        }
        
        .explanations h4, .chart-container h4, .alternatives h4 {
          font-size: 1.1rem;
          margin-bottom: 12px;
          color: #333;
        }
        
        .explanations ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .explanations li {
          margin-bottom: 8px;
          color: #555;
        }
        
        .chart-container {
          margin: 32px 0;
          height: 400px;
        }
        
        .warning-message {
          background-color: #fff9c4;
          border-left: 4px solid #ffc107;
          padding: 12px 16px;
          margin: 16px 0;
          color: #856404;
          border-radius: 4px;
        }
        
        .warning-message p {
          margin: 0;
        }
        
        .alternatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .alternative-option {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
        }
        
        .alt-count {
          font-weight: bold;
          font-size: 1.2rem;
          margin-bottom: 8px;
          color: #4285f4;
        }
        
        .alt-reason {
          font-size: 0.9rem;
          color: #555;
        }

        @media (max-width: 768px) {
          .prediction-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .confidence {
            margin-top: 8px;
          }
          
          .chart-container {
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
} 