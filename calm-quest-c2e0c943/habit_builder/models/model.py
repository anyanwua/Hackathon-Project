import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import json
import os

def train_and_evaluate():
    """
    Train a linear regression model to predict stress_level from lifestyle factors.
    Expected columns in data.csv:
    - sleep_hours
    - screen_time_hours
    - exercise_minutes
    - water_intake_liters
    - meditation_minutes
    - stress_level (target)
    """
    # Load dataset
    df = pd.read_csv('data/data.csv')
    
    # Define features and target
    feature_columns = [
        'sleep_hours',
        'screen_time_hours',
        'exercise_minutes',
        'water_intake_liters',
        'meditation_minutes'
    ]
    
    X = df[feature_columns]
    y = df['stress_level']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    train_score = model.score(X_train_scaled, y_train)
    test_score = model.score(X_test_scaled, y_test)
    
    print(f'Training R^2: {train_score:.4f}')
    print(f'Test R^2: {test_score:.4f}')
    
    # Extract model parameters
    coefficients = model.coef_
    intercept = model.intercept_
    scaler_means = scaler.mean_
    scaler_stds = scaler.scale_
    
    # Create model parameters dictionary
    model_params = {
        'coefficients': {
            'sleep_hours': float(coefficients[0]),
            'screen_time_hours': float(coefficients[1]),
            'exercise_minutes': float(coefficients[2]),
            'water_intake_liters': float(coefficients[3]),
            'meditation_minutes': float(coefficients[4])
        },
        'intercept': float(intercept),
        'scaler_means': {
            'sleep_hours': float(scaler_means[0]),
            'screen_time_hours': float(scaler_means[1]),
            'exercise_minutes': float(scaler_means[2]),
            'water_intake_liters': float(scaler_means[3]),
            'meditation_minutes': float(scaler_means[4])
        },
        'scaler_stds': {
            'sleep_hours': float(scaler_stds[0]),
            'screen_time_hours': float(scaler_stds[1]),
            'exercise_minutes': float(scaler_stds[2]),
            'water_intake_liters': float(scaler_stds[3]),
            'meditation_minutes': float(scaler_stds[4])
        }
    }
    
    # Save model parameters to JSON file
    output_path = 'models/model_params.json'
    with open(output_path, 'w') as f:
        json.dump(model_params, f, indent=2)
    
    print(f'\nModel parameters saved to {output_path}')
    print('\nCoefficients:')
    for i, col in enumerate(feature_columns):
        print(f'  {col}: {coefficients[i]:.6f}')
    print(f'\nIntercept: {intercept:.6f}')
    
    return model, scaler, model_params
