import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

# Load the unified dataset
df = pd.read_csv('../unified_lifestyle_dataset.csv')

# Prepare features and target
X = df[[
    "sleep_hours",
    "screen_time_hours",
    "exercise_minutes",
    "water_intake_liters",
    "meditation_minutes"
]]
y = df["stress_level"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
rf = RandomForestRegressor(random_state=42, n_estimators=100)
rf.fit(X_train, y_train)

# Get feature importance
rf_importance = pd.DataFrame({
    "feature": X.columns,
    "importance": rf.feature_importances_
})

# Normalize to sum to 1
rf_importance["weight"] = rf_importance["importance"] / rf_importance["importance"].sum()
rf_importance = rf_importance.sort_values("weight", ascending=False)

print("Feature Importance Weights:")
print(rf_importance)
print("\nWeight Map (for JavaScript):")
print("{")
for _, row in rf_importance.iterrows():
    print(f'  "{row["feature"]}": {row["weight"]:.6f},')
print("}")

# Save to JSON for easy import
import json
weight_map = dict(zip(rf_importance["feature"], rf_importance["weight"]))
with open('../habit_builder/models/feature_weights.json', 'w') as f:
    json.dump(weight_map, f, indent=2)

print(f"\nWeights saved to habit_builder/models/feature_weights.json")

