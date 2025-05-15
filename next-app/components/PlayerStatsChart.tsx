import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Import Plotly dynamically with SSR disabled
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface TableData {
  header: string[];
  rows: string[][];
}

interface PlayerStatsChartProps {
  tableData: TableData;
  className?: string;
}

export default function PlayerStatsChart({ tableData, className = '' }: PlayerStatsChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [layout, setLayout] = useState<any>({});

  useEffect(() => {
    if (!tableData || !tableData.header || !tableData.rows || tableData.rows.length === 0) {
      console.log("No table data available for chart");
      return;
    }

    console.log("Processing chart data:", tableData);
    // Process the table data into chart format
    processData();
  }, [tableData]);

  const processData = () => {
    try {
      // Find the time/hour column index
      const timeIndex = tableData.header.findIndex(h => 
        h.toLowerCase().includes('time') || 
        h.toLowerCase().includes('hour') || 
        h.toLowerCase() === 'hour'
      );
      const xIndex = timeIndex >= 0 ? timeIndex : 0;
      
      // Get the headers and skip the time column
      const dataHeaders = tableData.header.filter((_, index) => index !== xIndex);
      
      // Process data into Plotly format
      const traces = [];
      
      // Extract time values for x-axis, ensuring we only use the last 12 hours of data
      let hourData = tableData.rows.map(row => {
        // Extract hour value, handling different formats
        let hourStr = row[xIndex];
        let hour: number;
        
        // Handle different time formats
        if (hourStr.includes(':')) {
          // If it's a time format like "13:00"
          hour = parseInt(hourStr.split(':')[0]);
        } else if (hourStr.toLowerCase().includes('am') || hourStr.toLowerCase().includes('pm')) {
          // Handle AM/PM format
          const isPM = hourStr.toLowerCase().includes('pm');
          hour = parseInt(hourStr.replace(/[^0-9]/g, ''));
          if (isPM && hour < 12) hour += 12;
          if (!isPM && hour === 12) hour = 0;
        } else {
          // Try to parse as integer
          hour = parseInt(hourStr);
        }
        
        return {
          hour: isNaN(hour) ? 0 : hour,
          rowData: row
        };
      });
      
      // Sort by hour if possible
      hourData.sort((a, b) => a.hour - b.hour);
      
      // Limit to 12 hours if we have more data
      if (hourData.length > 12) {
        hourData = hourData.slice(hourData.length - 12);
      }
      
      // Format hours for display (adding AM/PM)
      const xValues = hourData.map(data => {
        const hour = data.hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${displayHour}:00 ${ampm}`;
      });
      
      // Create a trace for each stat (excluding the time column)
      for (let i = 0; i < dataHeaders.length; i++) {
        const headerIndex = tableData.header.indexOf(dataHeaders[i]);
        if (headerIndex === -1) continue;
        
        const statName = dataHeaders[i];
        const statValues = hourData.map(data => {
          const val = data.rowData[headerIndex] || '0';
          // Remove commas and % signs to parse as number
          const cleanVal = val.replace(/,/g, '').replace(/%/g, '').replace(/-/g, '0');
          const parsed = parseFloat(cleanVal);
          return isNaN(parsed) ? 0 : parsed;
        });
        
        traces.push({
          x: xValues,
          y: statValues,
          type: 'scatter',
          mode: 'lines+markers',
          name: statName,
          marker: { size: 8 }
        });
      }
      
      setChartData(traces);
      
      // Set up layout
      setLayout({
        title: '12-Hour Player Activity',
        xaxis: {
          title: 'Hour',
          tickangle: 45,
          tickmode: 'array',
          tickvals: xValues
        },
        yaxis: {
          title: 'Players',
          zeroline: true,
          rangemode: 'tozero',
          tickformat: ',d'  // Format as integer with commas
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
        height: 450
      });
    } catch (error) {
      console.error("Error processing chart data:", error);
    }
  };

  if (!chartData.length) {
    return (
      <div className={`chart-container ${className}`}>
        <div className="chart-placeholder">
          <p>No chart data available</p>
        </div>
        <style jsx>{`
          .chart-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
          .chart-placeholder {
            height: 300px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #666;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`chart-container ${className}`}>
      <Plot
        data={chartData}
        layout={layout}
        config={{ responsive: true, displayModeBar: true }}
        style={{ width: '100%', height: '100%' }}
      />
      <style jsx>{`
        .chart-container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          height: 500px;
        }
      `}</style>
    </div>
  );
} 