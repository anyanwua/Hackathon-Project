# How to Update Feature Weights

The scoring system uses Random Forest feature importance weights. To update them:

## Step 1: Calculate Weights from Your RF Model

Run this in your Python environment:

```python
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import json

# Load your dataset
df = pd.read_csv('../unified_lifestyle_dataset.csv')

X = df[[
    "sleep_hours",
    "screen_time_hours",
    "exercise_minutes",
    "water_intake_liters",
    "meditation_minutes"
]]
y = df["stress_level"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
rf = RandomForestRegressor(random_state=42)
rf.fit(X_train, y_train)

# Get feature importance
rf_importance = pd.DataFrame({
    "feature": X.columns,
    "importance": rf.feature_importances_
})

# Normalize to sum to 1
rf_importance["weight"] = rf_importance["importance"] / rf_importance["importance"].sum()
rf_importance = rf_importance.sort_values("weight", ascending=False)

print(rf_importance)

# Save to JSON
weight_map = dict(zip(rf_importance["feature"], rf_importance["weight"]))
with open('models/feature_weights.json', 'w') as f:
    json.dump(weight_map, f, indent=2)

print("\nWeights saved to models/feature_weights.json")
print("\nUpdate server/index.js FEATURE_WEIGHTS with these values:")
for feature, weight in weight_map.items():
    print(f'  {feature}: {weight:.6f},')
```

## Step 2: Update server/index.js

Copy the weights from the output and update the `FEATURE_WEIGHTS` constant in `server/index.js`:

```javascript
const FEATURE_WEIGHTS = {
  sleep_hours: 0.XXXXXX,          // Your calculated weight
  screen_time_hours: 0.XXXXXX,    // Your calculated weight
  exercise_minutes: 0.XXXXXX,      // Your calculated weight
  water_intake_liters: 0.XXXXXX,   // Your calculated weight
  meditation_minutes: 0.XXXXXX     // Your calculated weight
};
```

Make sure the weights sum to 1.0!

