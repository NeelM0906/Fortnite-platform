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
  best_player_count: number;
  explanations: string[];
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
  predictions: PredictionData;
  className?: string;
}

export default function PredictionResults({ predictions, className = '' }: PredictionResultsProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});
  
  useEffect(() => {
    // Log predictions to help debug
    console.log("Rendering predictions component with data:", predictions);
    
    // Process chart data when predictions change
    if (predictions && predictions.predictions) {
      processChartData();
    }
  }, [predictions]);
  
  const processChartData = () => {
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

  if (!predictions.best_player_count && predictions.best_player_count !== 0) {
    console.warn("Invalid predictions data - missing best_player_count");
    return (
      <div className={`prediction-results ${className} empty-prediction`}>
        <p>Invalid prediction data received</p>
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

  const confidence = predictions.confidence_score ? 
    (predictions.confidence_score * 100).toFixed(1) + '%' : 
    'N/A';

  const isSimplePrediction = predictions.is_simple_prediction || false;

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
          <span className="number">{predictions.best_player_count}</span>
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
          background-color: #ffffff;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .simple-prediction {
          border-left: 4px solid #fbbc05;
        }

        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        h3 {
          margin: 0;
          color: #222;
          font-size: 1.4rem;
        }

        h4 {
          margin: 16px 0 8px;
          color: #444;
          font-size: 1.1rem;
        }

        .confidence {
          background-color: #f8f9fa;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.9rem;
          color: #555;
        }

        .confidence span {
          font-weight: 600;
          color: #1a73e8;
        }

        .main-prediction {
          display: flex;
          justify-content: center;
          margin: 30px 0;
        }

        .best-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: #e8f0fe;
          border-radius: 12px;
          padding: 24px 36px;
        }

        .number {
          font-size: 3rem;
          font-weight: 700;
          color: #1a73e8;
          line-height: 1.2;
        }

        .label {
          font-size: 1.2rem;
          color: #444;
          margin-top: 4px;
        }

        .warning-message {
          background-color: #fff9e6;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-left: 4px solid #fbbc05;
        }

        .warning-message p {
          margin: 0;
          color: #624200;
          font-size: 0.95rem;
        }

        .explanations ul {
          margin: 0;
          padding-left: 20px;
        }

        .explanations li {
          margin-bottom: 8px;
          color: #444;
          line-height: 1.5;
        }
        
        .chart-container {
          margin: 20px 0;
          height: 400px;
          width: 100%;
        }

        .alternatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 12px;
        }

        .alternative-option {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e0e0e0;
        }

        .alt-count {
          font-weight: 600;
          color: #444;
          margin-bottom: 8px;
          font-size: 1.1rem;
        }

        .alt-reason {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
} 