import { useState } from 'react';

interface UseFortniteDataProps {
  onError?: (message: string) => void;
}

interface ScrapeResult {
  data?: any;
  error?: string;
}

interface PredictionResult {
  predictions?: any;
  error?: string;
}

export default function useFortniteData({ onError }: UseFortniteDataProps = {}) {
  const [mapCode, setMapCode] = useState('');
  const [scrapeData, setScrapeData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error, setError] = useState('');

  // Fetch map data
  const fetchMapData = async (code: string): Promise<boolean> => {
    if (!code) return false;
    
    setIsLoading(true);
    setError('');
    setScrapeData(null);
    setPredictions(null);
    setMapCode(code);
    
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapCode: code })
      });
      
      const result: ScrapeResult = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }
      
      if (result.data) {
        setScrapeData(result.data);
        return true;
      } else {
        throw new Error(result.error || 'No data returned from API');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch map data';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate predictions
  const generatePredictions = async (): Promise<boolean> => {
    if (!mapCode) return false;
    
    setIsPredicting(true);
    setError('');
    
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapCode })
      });
      
      const result: PredictionResult = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || `Server returned ${res.status}`);
      }
      
      if (result.predictions) {
        console.log("Received predictions:", result.predictions);
        setPredictions(result.predictions);
        return true;
      } else {
        throw new Error(result.error || 'Failed to generate predictions');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate predictions';
      console.error("Prediction error:", errorMessage);
      setError(errorMessage);
      if (onError) onError(errorMessage);
      return false;
    } finally {
      setIsPredicting(false);
    }
  };

  // Reset all data
  const reset = () => {
    setMapCode('');
    setScrapeData(null);
    setPredictions(null);
    setError('');
  };

  return {
    mapCode,
    scrapeData,
    predictions,
    isLoading,
    isPredicting,
    error,
    fetchMapData,
    generatePredictions,
    reset
  };
} 