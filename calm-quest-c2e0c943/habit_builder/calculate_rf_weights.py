#!/usr/bin/env python3
"""
Calculate Random Forest feature importance weights from unified_lifestyle_dataset.csv
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path

# Get the script directory and find the CSV file
script_dir = Path(__file__).parent
csv_path = script_dir.parent / 'unified_lifestyle_dataset.csv'

if not csv_path.exists():
    print(f"Error: Could not find {csv_path}")
    exit(1)

print(f"Loading dataset from {csv_path}...")
df = pd.read_csv(csv_path)

print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# Prepare features and target
feature_columns = [
    "sleep_hours",
    "screen_time_hours",
    "exercise_minutes",
    "water_intake_liters",
    "meditation_minutes"
]

# Check if all columns exist
missing_cols = [col for col in feature_columns if col not in df.columns]
if missing_cols:
    print(f"Error: Missing columns: {missing_cols}")
    exit(1)

X = df[feature_columns]
y = df["stress_level"]

print(f"\nFeatures shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Split data
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"\nTraining Random Forest model...")
from sklearn.ensemble import RandomForestRegressor
rf = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
rf.fit(X_train, y_train)

# Evaluate model
from sklearn.metrics import r2_score, mean_absolute_error
y_pred = rf.predict(X_test)
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print(f"\nModel Performance:")
print(f"  R² Score: {r2:.4f}")
print(f"  MAE: {mae:.4f}")

# Get feature importance
rf_importance = pd.DataFrame({
    "feature": X.columns,
    "importance": rf.feature_importances_
})

# Normalize to sum to 1
rf_importance["weight"] = rf_importance["importance"] / rf_importance["importance"].sum()
rf_importance = rf_importance.sort_values("weight", ascending=False)

print(f"\n{'='*60}")
print("Feature Importance Weights (normalized to sum to 1):")
print(f"{'='*60}")
print(rf_importance.to_string(index=False))

# Verify weights sum to 1
total_weight = rf_importance["weight"].sum()
print(f"\nTotal weight sum: {total_weight:.10f} (should be 1.0)")

# Create weight map
weight_map = dict(zip(rf_importance["feature"], rf_importance["weight"]))

# Save to JSON
output_dir = script_dir / 'models'
output_dir.mkdir(exist_ok=True)
output_path = output_dir / 'feature_weights.json'

with open(output_path, 'w') as f:
    json.dump(weight_map, f, indent=2)

print(f"\n{'='*60}")
print(f"Weights saved to: {output_path}")
print(f"{'='*60}")

# Print JavaScript format for easy copy-paste
print("\nJavaScript format (for server/index.js):")
print("const FEATURE_WEIGHTS = {")
for feature, weight in weight_map.items():
    print(f'  {feature}: {weight:.6f},')
print("};")

print("\n✅ Done!")

