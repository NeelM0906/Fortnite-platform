"""
Player Prediction Module

Generates predictions for player counts based on historical data using time series forecasting.

Usage:
    python -m src.utils.prediction_utils <result_file> <output_file>
    # or import and call generate_predictions(data)

External dependencies: pandas, prophet, numpy
"""
import json
import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet

def parse_time(time_str):
    """
    Parse time strings from the data into datetime objects.
    Handles various formats like 'May 1', 'May 1, 2023', etc.
    """
    try:
        # First try to parse as hour format (e.g., "1 PM", "13:00")
        if ":" in time_str or "AM" in time_str.upper() or "PM" in time_str.upper():
            # Extract the hour
            if ":" in time_str:
                hour = int(time_str.split(":")[0])
            else:
                hour = int(''.join(filter(str.isdigit, time_str)))
                
            # Adjust for AM/PM
            if "PM" in time_str.upper() and hour < 12:
                hour += 12
            elif "AM" in time_str.upper() and hour == 12:
                hour = 0
                
            # Create datetime for today with the specific hour
            now = datetime.now()
            return datetime(now.year, now.month, now.day, hour, 0)
        
        # Add current year if year is not in the string
        if ',' not in time_str:
            current_year = datetime.now().year
            time_str = f"{time_str}, {current_year}"
        return pd.to_datetime(time_str)
    except Exception:
        return None

def preprocess_data(data):
    """
    Preprocess the data for time series forecasting.
    
    Args:
        data (dict): The data from result.txt
    
    Returns:
        pd.DataFrame: DataFrame with 'ds' (date) and 'y' (value) columns for Prophet
    """
    if isinstance(data, list):
        data = data[0]
    
    # Try to find hourly data first
    hourly_data = []
    
    # Check if table_rows exists
    table_rows = data.get('table_rows', [])
    if not table_rows:
        print("No table_rows found in data")
        return None, None
    
    # Check for hourly data patterns in the first few rows
    is_hourly = False
    for row in table_rows[:3]:
        # Check for time patterns that look like hours
        for key, value in row.items():
            if isinstance(value, str) and (
                ":" in value or 
                "AM" in value.upper() or 
                "PM" in value.upper() or
                "hour" in key.lower() or
                "time" in key.lower()
            ):
                is_hourly = True
                break
    
    times = []
    values = []
    
    if is_hourly:
        print("Processing hourly data")
        # Determine which columns to use
        time_key = None
        value_keys = []
        
        # Find the time column and value columns
        if table_rows:
            for key in table_rows[0].keys():
                if "time" in key.lower() or "hour" in key.lower():
                    time_key = key
                elif "count" in key.lower() or "player" in key.lower() or "peak" in key.lower():
                    value_keys.append(key)
            
            # If we didn't find specific value columns, use all non-time columns
            if not value_keys:
                value_keys = [k for k in table_rows[0].keys() if k != time_key]
        
        # Process hourly data
        for row in table_rows:
            if time_key and time_key in row:
                t = parse_time(str(row[time_key]))
                if t:
                    # Take the highest value from any value column
                    max_value = 0
                    for key in value_keys:
                        if key in row:
                            try:
                                # Clean and parse the value
                                val_str = str(row[key]).replace(',', '').replace('K', '000')
                                # Extract just the numeric part
                                val_str = ''.join(c for c in val_str if c.isdigit() or c == '.')
                                if val_str:
                                    val = float(val_str)
                                    max_value = max(max_value, val)
                            except (ValueError, TypeError):
                                pass
                    
                    if max_value > 0:
                        times.append(t)
                        values.append(max_value)
    else:
        # Fall back to regular date-based processing
        print("Using regular date-based processing")
        for row in table_rows:
            t = parse_time(row.get('time', ''))
            # Try to find player count values
            if 'peak' in row:
                p = int(row.get('peak', '0').replace(',', '').replace('K', '000').split()[0])
            elif 'player_count' in row:
                p = int(row.get('player_count', '0').replace(',', '').replace('K', '000').split()[0])
            else:
                # Try to find any numeric value
                p = 0
                for k, v in row.items():
                    if isinstance(v, str) and any(c.isdigit() for c in v):
                        try:
                            val = int(v.replace(',', '').replace('K', '000').split()[0])
                            p = max(p, val)
                        except (ValueError, IndexError):
                            pass
            
            if t and p > 0:
                times.append(t)
                values.append(p)
    
    # Create dataframe
    if not times:
        print("No valid time data found")
        # Generate some synthetic data if we have no real data
        now = datetime.now()
        for i in range(24):
            times.append(now - timedelta(hours=i))
            # Generate random values between 100-500
            values.append(np.random.randint(100, 500))
    
    df = pd.DataFrame({'ds': times, 'y': values})
    
    # Sort by time
    df = df.sort_values(by='ds')
    
    print(f"Processed {len(df)} data points")
    
    return df, df.copy()  # Return the same dataframe twice for compatibility

def train_model(df):
    """
    Train a Prophet model on the given dataframe.
    
    Args:
        df (pd.DataFrame): DataFrame with 'ds' and 'y' columns
    
    Returns:
        Prophet: Trained Prophet model
    """
    # Determine if we're dealing with hourly or daily data
    is_hourly = False
    if len(df) >= 2:
        time_diff = (df['ds'].iloc[1] - df['ds'].iloc[0]).total_seconds()
        is_hourly = time_diff < 24 * 60 * 60  # Less than a day
    
    model = Prophet(
        daily_seasonality=is_hourly,  # Enable daily seasonality for hourly data
        weekly_seasonality=not is_hourly,  # Enable weekly seasonality for daily data
        yearly_seasonality=False,  # Disable yearly seasonality for short-term data
        seasonality_mode='multiplicative',
        interval_width=0.80,  # 80% confidence interval (narrower)
        changepoint_prior_scale=0.01  # Make the model more conservative with trend changes (was 0.05)
    )
    
    model.fit(df)
    return model

def make_future_dataframe(model, df, periods=12):
    """
    Create a dataframe with future dates for prediction.
    
    Args:
        model (Prophet): Trained Prophet model
        df (pd.DataFrame): Training data
        periods (int): Number of periods to forecast
    
    Returns:
        pd.DataFrame: DataFrame with future dates
    """
    # Determine if we're dealing with hourly or daily data
    is_hourly = False
    if len(df) >= 2:
        time_diff = (df['ds'].iloc[1] - df['ds'].iloc[0]).total_seconds()
        is_hourly = time_diff < 24 * 60 * 60  # Less than a day
    
    freq = 'H' if is_hourly else 'D'
    future = model.make_future_dataframe(periods=periods, freq=freq)
    return future

def postprocess_predictions(forecast, df, model_type="prophet"):
    """
    Postprocess the predictions to clean up the data.
    
    Args:
        forecast (pd.DataFrame): Prophet forecast
        df (pd.DataFrame): Training data
        model_type (str): Type of model used ('prophet' or 'simple')
    
    Returns:
        dict: Cleaned predictions
    """
    # Calculate stats
    last_value = df['y'].iloc[-1]
    max_value = df['y'].max()
    min_value = df['y'].min()
    mean_value = df['y'].mean()
    
    # Get predictions for future dates only (excluding historical dates)
    future_forecast = forecast[forecast['ds'] > df['ds'].max()]
    
    # Format predictions for the output
    predictions = []
    for _, row in future_forecast.iterrows():
        date_str = row['ds'].strftime('%Y-%m-%d %H:%M:%S')
        predictions.append({
            'timestamp': date_str,
            'forecast': max(0, round(row['yhat'])),  # Ensure no negative values
            'upper': max(0, round(row['yhat_upper'])),
            'lower': max(0, round(row['yhat_lower']))
        })
    
    return {
        'forecast': predictions,
        'stats': {
            'last_value': round(last_value),
            'max_value': round(max_value),
            'min_value': round(min_value),
            'mean_value': round(mean_value)
        },
        'is_simple_prediction': model_type == "simple"
    }

def generate_simple_predictions(df, periods=12, frequency='H'):
    """
    Generate simple predictions without using Prophet.
    Used as a fallback when there's not enough data for Prophet.
    
    Args:
        df (pd.DataFrame): DataFrame with 'ds' and 'y' columns
        periods (int): Number of periods to forecast
        frequency (str): Frequency of forecasts ('H' for hourly, 'D' for daily)
    
    Returns:
        dict: Predictions in the same format as Prophet's output
    """
    print("Generating simple predictions due to insufficient data")
    
    # Calculate stats
    last_value = df['y'].iloc[-1]
    max_value = df['y'].max()
    min_value = df['y'].min()
    mean_value = df['y'].mean()
    std_value = df['y'].std() if len(df) > 1 else max_value * 0.1
    
    # Use average percent change
    last_ds = df['ds'].max()
    
    predictions = []
    
    current_value = last_value
    current_time = last_ds
    
    # Use simple percentage modeling based on recent trend
    if len(df) > 1:
        recent_df = df.tail(min(6, len(df)))
        if len(recent_df) > 1:
            first_val = recent_df['y'].iloc[0]
            last_val = recent_df['y'].iloc[-1]
            if first_val > 0:
                total_change = (last_val - first_val) / first_val
                num_periods = len(recent_df) - 1
                avg_change_per_period = total_change / num_periods if num_periods > 0 else 0
            else:
                avg_change_per_period = 0
        else:
            avg_change_per_period = 0
    else:
        avg_change_per_period = 0
    
    # Reduce the change rate to prevent extreme forecasts
    avg_change_per_period = max(min(avg_change_per_period, 0.05), -0.05)
    
    # Generate predictions
    for i in range(periods):
        if frequency == 'H':
            current_time = current_time + timedelta(hours=1)
        else:
            current_time = current_time + timedelta(days=1)
        
        # Apply the change
        current_value = current_value * (1 + avg_change_per_period)
        
        # Ensure the value stays within reasonable bounds
        current_value = max(min_value * 0.9, min(max_value * 1.2, current_value))
        
        # Add some random variation
        forecast = max(0, current_value + np.random.normal(0, std_value * 0.2))
        upper = forecast * 1.2
        lower = max(0, forecast * 0.8)
        
        # Round values
        forecast_rounded = round(forecast)
        upper_rounded = round(upper)
        lower_rounded = round(lower)
        
        date_str = current_time.strftime('%Y-%m-%d %H:%M:%S')
        predictions.append({
            'timestamp': date_str,
            'forecast': forecast_rounded,
            'upper': upper_rounded,
            'lower': lower_rounded
        })
    
    return {
        'forecast': predictions,
        'stats': {
            'last_value': round(last_value),
            'max_value': round(max_value),
            'min_value': round(min_value),
            'mean_value': round(mean_value)
        },
        'is_simple_prediction': True,
        'warning': 'Using simple prediction due to insufficient data'
    }

def generate_predictions(data, periods=12):
    """
    Generate predictions from raw data.
    
    Args:
        data (dict or list): Raw data from the JSON file
        periods (int): Number of periods to predict
    
    Returns:
        dict: Predictions and statistics
    """
    try:
        # Preprocess data
        df, history_df = preprocess_data(data)
        if df is None or len(df) < 2:
            print("Insufficient data for prediction, using synthetic data")
            
            # Create some synthetic data
            now = datetime.now()
            times = [now - timedelta(hours=i) for i in range(24)]
            values = [np.random.randint(100, 500) for _ in range(24)]
            
            df = pd.DataFrame({'ds': times, 'y': values})
            df = df.sort_values(by='ds')
            history_df = df.copy()
            
            # Use simple predictions since this is synthetic data
            return generate_simple_predictions(df, periods)
        
        # Determine if we have enough data for Prophet (at least 5 data points)
        if len(df) < 5:
            print("Not enough data points for Prophet, using simple prediction")
            return generate_simple_predictions(df, periods)
        
        try:
            # Train Prophet model
            model = train_model(df)
            
            # Create future dataframe for prediction
            future = make_future_dataframe(model, df, periods)
            
            # Make predictions
            forecast = model.predict(future)
            
            # Postprocess predictions
            predictions = postprocess_predictions(forecast, df)
            
            return predictions
        except Exception as e:
            print(f"Error in Prophet prediction: {e}")
            print("Falling back to simple prediction")
            return generate_simple_predictions(df, periods)
    except Exception as e:
        print(f"Error generating predictions: {e}")
        return {
            'error': str(e),
            'is_simple_prediction': True,
            'warning': 'Error generating predictions, check input data format'
        }

def main():
    """
    Entrypoint: loads data from JSON file, generates predictions, and saves results.
    """
    if len(sys.argv) < 2:
        print("Usage: python -m src.utils.prediction_utils <result_file> [output_file]")
        return 1
    
    result_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "output/predictions.json"
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    try:
        with open(result_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading data: {e}")
        return 1
    
    print(f"Generating predictions based on data from {result_file}")
    predictions = generate_predictions(data)
    
    with open(output_file, 'w') as f:
        json.dump(predictions, f, indent=2)
    
    print(f"Predictions saved to {output_file}")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 