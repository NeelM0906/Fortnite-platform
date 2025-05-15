// User types
export interface UserProfile {
  id: string;
  display_name: string;
  bio: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFormData {
  display_name: string;
  bio: string;
}

// Fortnite data types
export interface PlayerStat {
  stat_label: string;
  stat_value: string;
}

export interface TableData {
  header: string[];
  rows: string[][];
}

export interface IslandData {
  title?: string;
  code?: string;
  creator?: string;
  description?: string;
  tags?: string[];
  creator_code?: string;
  published_date?: string;
  version?: string;
  player_stats?: PlayerStat[];
  table_data?: TableData;
}

export interface ScrapeResult {
  data?: IslandData[];
  error?: string;
}

// Prediction types
export interface PredictionAlternative {
  player_count: number;
  reason: string;
}

export interface PredictionData {
  best_player_count: number;
  explanations: string[];
  confidence_score?: number;
  is_simple_prediction?: boolean;
  warning?: string;
  alternatives?: PredictionAlternative[];
}

export interface PredictionResult {
  predictions?: PredictionData;
  error?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 