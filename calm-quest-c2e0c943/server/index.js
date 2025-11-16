import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Initialize with default data if file doesn't exist
    return { users: {} };
  }
}

// Helper function to write data
async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Get or create user data
async function getUserData(userId = 'default') {
  const data = await readData();
  if (!data.users[userId]) {
    const today = new Date().toISOString().split('T')[0];
    data.users[userId] = {
      xp: 0,
      level: 1,
      xpToNextLevel: 30,
      currentStreak: 0,
      lastCheckinDate: '',
      loginStreak: 0,
      badgesUnlocked: [],
      dailyTasksCompleted: false,
      points: 0,
      completedRecommendations: []
    };
    await writeData(data);
  }
  return data.users[userId];
}

// Calculate XP to next level
function calculateXPToNextLevel(level) {
  if (level === 1) return 30;
  return 30 + (level - 1) * 10;
}

// Check for level up (handles multiple level-ups if XP exceeds multiple thresholds)
function checkForLevelUp(userData) {
  let currentLevel = userData.level;
  let currentXP = userData.xp;
  let xpToNext = userData.xpToNextLevel;
  
  // Handle multiple level-ups if XP exceeds multiple thresholds
  while (currentXP >= xpToNext) {
    currentLevel += 1;
    xpToNext = calculateXPToNextLevel(currentLevel);
  }
  
  if (currentLevel > userData.level) {
    return {
      leveledUp: true,
      newLevel: currentLevel
    };
  }
  return { leveledUp: false, newLevel: null };
}

// Update streak
function updateStreak(userData) {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = userData.lastCheckinDate;
  let newStreak = userData.currentStreak;
  let streakXP = 0;

  if (lastDate === today) {
    return { newData: userData, streakXP: 0 };
  }

  if (lastDate === '') {
    newStreak = 1;
  } else {
    const lastCheckin = new Date(lastDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      newStreak = userData.currentStreak + 1;
    } else if (daysDiff > 1) {
      newStreak = 1;
    }
  }

  if (newStreak >= 3) {
    streakXP = 10;
  } else if (newStreak >= 2) {
    streakXP = 5;
  }

  const newData = {
    ...userData,
    currentStreak: newStreak,
    lastCheckinDate: today
  };

  return { newData, streakXP };
}

// Check badge conditions
function checkBadgeConditions(userData) {
  const newlyUnlocked = [];

  if (userData.currentStreak >= 3 && !userData.badgesUnlocked.includes('streak3')) {
    newlyUnlocked.push('streak3');
  }

  if (userData.dailyTasksCompleted && !userData.badgesUnlocked.includes('allTasks')) {
    newlyUnlocked.push('allTasks');
  }

  if (userData.loginStreak >= 3 && !userData.badgesUnlocked.includes('login3')) {
    newlyUnlocked.push('login3');
  }

  return newlyUnlocked;
}

// API Routes

// Get user data
app.get('/api/user/:userId?', async (req, res) => {
  try {
    const userId = req.params.userId || 'default';
    const userData = await getUserData(userId);
    
    // Reset dailyTasksCompleted if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (userData.lastCheckinDate !== today) {
      userData.dailyTasksCompleted = false;
    }
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Linear Regression Model Parameters (from habit_builder)
// Try to load from habit_builder/models/model_params.json, fallback to defaults if not available
let SCALER_MEANS, SCALER_STDS, LR_COEFFICIENTS, LR_INTERCEPT;

try {
  const modelParamsPath = join(__dirname, '../habit_builder/models/model_params.json');
  if (existsSync(modelParamsPath)) {
    const modelParamsData = readFileSync(modelParamsPath, 'utf8');
    const modelParams = JSON.parse(modelParamsData);
    SCALER_MEANS = modelParams.scaler_means;
    SCALER_STDS = modelParams.scaler_stds;
    LR_COEFFICIENTS = modelParams.coefficients;
    LR_INTERCEPT = modelParams.intercept;
    console.log('Loaded model parameters from habit_builder/models/model_params.json');
  } else {
    throw new Error('Model params file not found, using defaults');
  }
} catch (error) {
  console.warn('Could not load model parameters from habit_builder, using default values:', error.message);
  // Default values (from Venture Track, will be replaced when habit_builder model is trained)
  SCALER_MEANS = {
    sleep_hours: 7.2,
    screen_time_hours: 5.8,
    exercise_minutes: 54.0,
    water_intake_liters: 3.0,
    meditation_minutes: 11.0
  };

  SCALER_STDS = {
    sleep_hours: 0.8,
    screen_time_hours: 1.5,
    exercise_minutes: 12.0,
    water_intake_liters: 0.5,
    meditation_minutes: 9.0
  };

  LR_COEFFICIENTS = {
    exercise_minutes: 0.278286,
    screen_time_hours: 0.038877,
    sleep_hours: -0.006555,
    water_intake_liters: -0.008884,
    meditation_minutes: -0.047862
  };

  LR_INTERCEPT = 5.108866889054614;
}

// Standardize a value
function standardize(value, mean, std) {
  return (value - mean) / std;
}

// Calculate factor score (0-100) for each metric
function calculateFactorScore(factor, value) {
  switch (factor) {
    case 'sleep':
      // Ideal: 7-9 hours (optimal: 8)
      const sleepDeviation = Math.abs(8 - value);
      return Math.max(0, ((10 - sleepDeviation) / 10) * 100);
    
    case 'screen':
      // Ideal: <= 4 hours (lower is better)
      if (value <= 4) return 100;
      return Math.max(0, ((10 - (value - 4)) / 10) * 100);
    
    case 'exercise':
      // Ideal: >= 30 minutes (more is better, capped at 100)
      return Math.min(100, (value / 30) * 100);
    
    case 'water':
      // Ideal: 2-3L (optimal: 2.5L)
      const idealWater = 2.5;
      const waterDeviation = Math.abs(idealWater - value) * 2;
      return Math.max(0, ((10 - waterDeviation) / 10) * 100);
    
    case 'meditation':
      // Ideal: >= 10 minutes (more is better, capped at 100)
      return Math.min(100, (value / 10) * 100);
    
    default:
      return 0;
  }
}

// Generate recommendations based on user metrics with granular thresholds
function generateRecommendations(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes, predictedStressLevel) {
  const recommendations = [];
  
  // Calculate factor scores
  const sleepScore = calculateFactorScore('sleep', sleepHours);
  const screenScore = calculateFactorScore('screen', screenTimeHours);
  const exerciseScore = calculateFactorScore('exercise', exerciseMinutes);
  const waterScore = calculateFactorScore('water', waterIntakeLiters);
  const meditationScore = calculateFactorScore('meditation', meditationMinutes);
  
  // SLEEP RECOMMENDATIONS
  if (sleepHours < 5) {
    // Very low sleep (< 5 hours)
    recommendations.push({
      id: 'sleep-very-low',
      title: "🚨 Critical: Severe Sleep Deprivation",
      description: `You're getting only ${sleepHours.toFixed(1)} hours of sleep. This is critically low and can severely impact your health. Aim for at least 7 hours immediately.`,
      xp: 20,
      priority: 'high'
    });
  } else if (sleepHours < 6) {
    // Low sleep (5-6 hours)
    recommendations.push({
      id: 'sleep-low',
      title: "⚠️ Low Sleep Warning",
      description: `You're getting ${sleepHours.toFixed(1)} hours of sleep. This is below the recommended 7-9 hours. Try to go to bed earlier or improve your sleep routine.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (sleepHours < 7) {
    // Moderate-low sleep (6-7 hours)
    recommendations.push({
      id: 'sleep-moderate-low',
      title: "💤 Slightly Low Sleep",
      description: `You're getting ${sleepHours.toFixed(1)} hours of sleep. Aim for 7-9 hours for optimal recovery and cognitive function.`,
      xp: 20,
      priority: 'low'
    });
  } else if (sleepHours >= 7 && sleepHours <= 7.5) {
    // Medium sleep (7-7.5 hours) - good but could optimize
    recommendations.push({
      id: 'sleep-medium',
      title: "💤 Good Sleep, Room to Optimize",
      description: `You're getting ${sleepHours.toFixed(1)} hours of sleep, which is good! Consider aiming for 8-9 hours to maximize recovery and cognitive performance.`,
      xp: 20,
      priority: 'low'
    });
  } else if (sleepHours > 10) {
    // Very high sleep (> 10 hours)
    recommendations.push({
      id: 'sleep-very-high',
      title: "😴 Excessive Sleep",
      description: `You're sleeping ${sleepHours.toFixed(1)} hours, which may indicate underlying health issues or poor sleep quality. Consider consulting a healthcare provider.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (sleepHours > 9) {
    // High sleep (9-10 hours)
    recommendations.push({
      id: 'sleep-high',
      title: "💤 Above Optimal Sleep",
      description: `You're getting ${sleepHours.toFixed(1)} hours of sleep. While not harmful, 7-9 hours is typically optimal for most adults.`,
      xp: 20,
      priority: 'low'
    });
  }
  
  // SCREEN TIME RECOMMENDATIONS
  if (screenTimeHours > 12) {
    // Very high screen time (> 12 hours)
    recommendations.push({
      id: 'screen-very-high',
      title: "🚨 Critical: Excessive Screen Time",
      description: `You're spending ${screenTimeHours.toFixed(1)} hours on screens daily. This is extremely high and can cause eye strain, sleep disruption, and mental fatigue. Try to reduce by at least 2-3 hours.`,
      xp: 20,
      priority: 'high'
    });
  } else if (screenTimeHours > 10) {
    // High screen time (10-12 hours)
    recommendations.push({
      id: 'screen-high',
      title: "⚠️ High Screen Time",
      description: `You're spending ${screenTimeHours.toFixed(1)} hours on screens. Try to limit to under 8 hours and take regular breaks every 20-30 minutes.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (screenTimeHours > 8) {
    // Moderate-high screen time (8-10 hours)
    recommendations.push({
      id: 'screen-moderate-high',
      title: "📱 Moderate-High Screen Time",
      description: `You're spending ${screenTimeHours.toFixed(1)} hours on screens. Consider reducing to under 8 hours and practice the 20-20-20 rule (look 20 feet away for 20 seconds every 20 minutes).`,
      xp: 20,
      priority: 'low'
    });
  } else if (screenTimeHours >= 4 && screenTimeHours <= 8) {
    // Medium screen time (4-8 hours) - moderate range
    recommendations.push({
      id: 'screen-medium',
      title: "📱 Moderate Screen Time",
      description: `You're spending ${screenTimeHours.toFixed(1)} hours on screens. This is manageable, but try to reduce to under 6 hours for optimal eye health and sleep quality. Take regular breaks!`,
      xp: 20,
      priority: 'low'
    });
  } else if (screenTimeHours < 2) {
    // Very low screen time (< 2 hours) - might be good, but could indicate other issues
    recommendations.push({
      id: 'screen-very-low',
      title: "✅ Excellent Screen Time Management",
      description: `Great job! You're only spending ${screenTimeHours.toFixed(1)} hours on screens. Keep up this healthy habit!`,
      xp: 20,
      priority: 'low'
    });
  }
  
  // EXERCISE RECOMMENDATIONS
  if (exerciseMinutes < 10) {
    // Very low exercise (< 10 minutes)
    recommendations.push({
      id: 'exercise-very-low',
      title: "🚨 Critical: Minimal Physical Activity",
      description: `You're only getting ${exerciseMinutes} minutes of exercise. This is critically low. Start with just 10-15 minutes of walking daily and gradually increase.`,
      xp: 20,
      priority: 'high'
    });
  } else if (exerciseMinutes < 20) {
    // Low exercise (10-20 minutes)
    recommendations.push({
      id: 'exercise-low',
      title: "⚠️ Low Exercise Level",
      description: `You're getting ${exerciseMinutes} minutes of exercise. Aim for at least 30 minutes daily. Try adding a 10-minute walk or quick workout.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (exerciseMinutes < 30) {
    // Moderate-low exercise (20-30 minutes)
    recommendations.push({
      id: 'exercise-moderate-low',
      title: "💪 Slightly Below Target",
      description: `You're getting ${exerciseMinutes} minutes of exercise. You're close to the recommended 30 minutes - try adding just 10 more minutes!`,
      xp: 20,
      priority: 'low'
    });
  } else if (exerciseMinutes >= 30 && exerciseMinutes <= 60) {
    // Medium exercise (30-60 minutes) - good baseline
    recommendations.push({
      id: 'exercise-medium',
      title: "💪 Good Exercise Routine",
      description: `You're getting ${exerciseMinutes} minutes of exercise, which meets the recommended minimum! Consider adding variety or increasing intensity for even better results.`,
      xp: 20,
      priority: 'low'
    });
  } else if (exerciseMinutes > 120) {
    // Very high exercise (> 120 minutes)
    recommendations.push({
      id: 'exercise-very-high',
      title: "💪 High Exercise Volume",
      description: `You're exercising ${exerciseMinutes} minutes daily. While impressive, ensure you're getting adequate rest and recovery. Listen to your body!`,
      xp: 20,
      priority: 'low'
    });
  } else if (exerciseMinutes > 90) {
    // High exercise (90-120 minutes)
    recommendations.push({
      id: 'exercise-high',
      title: "💪 Excellent Exercise Routine",
      description: `Great job with ${exerciseMinutes} minutes of exercise! You're exceeding the recommended 30 minutes. Keep it up!`,
      xp: 20,
      priority: 'low'
    });
  }
  
  // WATER INTAKE RECOMMENDATIONS
  if (waterIntakeLiters < 1) {
    // Very low water (< 1L)
    recommendations.push({
      id: 'water-very-low',
      title: "🚨 Critical: Severe Dehydration Risk",
      description: `You're only drinking ${waterIntakeLiters.toFixed(1)}L of water. This is dangerously low. Aim for at least 2-3 liters daily to prevent dehydration.`,
      xp: 20,
      priority: 'high'
    });
  } else if (waterIntakeLiters < 1.5) {
    // Low water (1-1.5L)
    recommendations.push({
      id: 'water-low',
      title: "⚠️ Low Water Intake",
      description: `You're drinking ${waterIntakeLiters.toFixed(1)}L of water. This is below the recommended 2-3 liters. Try to increase your intake gradually.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (waterIntakeLiters < 2) {
    // Moderate-low water (1.5-2L)
    recommendations.push({
      id: 'water-moderate-low',
      title: "💧 Slightly Low Hydration",
      description: `You're drinking ${waterIntakeLiters.toFixed(1)}L of water. Aim for 2-3 liters for optimal hydration. Try adding one more glass of water.`,
      xp: 20,
      priority: 'low'
    });
  } else if (waterIntakeLiters >= 2 && waterIntakeLiters <= 3) {
    // Medium water (2-3L) - good range
    recommendations.push({
      id: 'water-medium',
      title: "💧 Good Hydration Level",
      description: `You're drinking ${waterIntakeLiters.toFixed(1)}L of water, which is in the recommended range! Keep up the good hydration habits.`,
      xp: 20,
      priority: 'low'
    });
  } else if (waterIntakeLiters > 5) {
    // Very high water (> 5L)
    recommendations.push({
      id: 'water-very-high',
      title: "💧 Excessive Water Intake",
      description: `You're drinking ${waterIntakeLiters.toFixed(1)}L of water. While rare, excessive water intake can be harmful. Consult a healthcare provider if this is consistent.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (waterIntakeLiters > 4) {
    // High water (4-5L)
    recommendations.push({
      id: 'water-high',
      title: "💧 High Water Intake",
      description: `You're drinking ${waterIntakeLiters.toFixed(1)}L of water. This is above the typical recommendation. Ensure you're not overhydrating.`,
      xp: 20,
      priority: 'low'
    });
  }
  
  // MEDITATION RECOMMENDATIONS
  if (meditationMinutes === 0) {
    // No meditation
    if (predictedStressLevel > 5) {
      recommendations.push({
        id: 'meditation-none-stress',
        title: "🧘 Start Meditation Practice",
        description: `You're not practicing meditation, and your stress level is elevated (${predictedStressLevel.toFixed(1)}/10). Even 5-10 minutes daily can significantly reduce stress.`,
        xp: 20,
        priority: 'high'
      });
    } else {
      recommendations.push({
        id: 'meditation-none',
        title: "🧘 Consider Meditation",
        description: `You're not practicing meditation. Even 5-10 minutes daily can improve focus, reduce stress, and enhance well-being.`,
        xp: 20,
        priority: 'low'
      });
    }
  } else if (meditationMinutes < 5) {
    // Very low meditation (< 5 minutes)
    if (predictedStressLevel > 5) {
      recommendations.push({
        id: 'meditation-very-low-stress',
        title: "🧘 Increase Meditation Time",
        description: `You're only meditating ${meditationMinutes} minutes. With stress at ${predictedStressLevel.toFixed(1)}/10, try increasing to 10-15 minutes for better results.`,
        xp: 20,
        priority: 'high'
      });
    } else {
      recommendations.push({
        id: 'meditation-very-low',
        title: "🧘 Build Meditation Habit",
        description: `You're meditating ${meditationMinutes} minutes. Try gradually increasing to 10 minutes for optimal benefits.`,
        xp: 20,
        priority: 'low'
      });
    }
  } else if (meditationMinutes < 10) {
    // Low meditation (5-10 minutes)
    if (predictedStressLevel > 6) {
      recommendations.push({
        id: 'meditation-low-stress',
        title: "🧘 Extend Meditation Sessions",
        description: `You're meditating ${meditationMinutes} minutes. With high stress (${predictedStressLevel.toFixed(1)}/10), consider extending to 15-20 minutes for deeper relaxation.`,
        xp: 20,
        priority: 'medium'
      });
    } else {
      recommendations.push({
        id: 'meditation-low',
        title: "🧘 Good Start, Keep Going",
        description: `You're meditating ${meditationMinutes} minutes. Try to reach 10-15 minutes for enhanced benefits.`,
        xp: 20,
        priority: 'low'
      });
    }
  } else if (meditationMinutes >= 10 && meditationMinutes <= 20) {
    // Medium meditation (10-20 minutes) - good baseline
    recommendations.push({
      id: 'meditation-medium',
      title: "🧘 Good Meditation Practice",
      description: `You're meditating ${meditationMinutes} minutes, which is great! Consider extending to 20-30 minutes for deeper benefits, especially if stress levels are elevated.`,
      xp: 20,
      priority: 'low'
    });
  } else if (meditationMinutes > 60) {
    // Very high meditation (> 60 minutes)
    recommendations.push({
      id: 'meditation-very-high',
      title: "🧘 Extensive Meditation Practice",
      description: `You're meditating ${meditationMinutes} minutes daily. This is excellent! Ensure you're balancing meditation with other activities.`,
      xp: 20,
      priority: 'low'
    });
  } else if (meditationMinutes > 30) {
    // High meditation (30-60 minutes)
    recommendations.push({
      id: 'meditation-high',
      title: "🧘 Excellent Meditation Routine",
      description: `Great job with ${meditationMinutes} minutes of meditation! You're well above the recommended 10 minutes.`,
      xp: 20,
      priority: 'low'
    });
  }
  
  // STRESS MANAGEMENT RECOMMENDATIONS (based on predicted stress level)
  if (predictedStressLevel > 8) {
    // Very high stress (> 8/10)
    recommendations.push({
      id: 'stress-very-high',
      title: "🚨 Critical: Extremely High Stress",
      description: `Your predicted stress level is ${predictedStressLevel.toFixed(1)}/10, which is critically high. Consider professional support, deep breathing exercises, and immediate stress-reduction techniques.`,
      xp: 20,
      priority: 'high'
    });
  } else if (predictedStressLevel > 7) {
    // High stress (7-8/10)
    recommendations.push({
      id: 'stress-high',
      title: "⚠️ High Stress Level",
      description: `Your predicted stress level is ${predictedStressLevel.toFixed(1)}/10. Try meditation, exercise, or talking to someone. Consider what's causing your stress.`,
      xp: 20,
      priority: 'high'
    });
  } else if (predictedStressLevel > 6) {
    // Moderate-high stress (6-7/10)
    recommendations.push({
      id: 'stress-moderate-high',
      title: "😟 Elevated Stress",
      description: `Your predicted stress level is ${predictedStressLevel.toFixed(1)}/10. Practice stress management techniques like deep breathing, breaks, or light exercise.`,
      xp: 20,
      priority: 'medium'
    });
  } else if (predictedStressLevel >= 4 && predictedStressLevel <= 6) {
    // Medium stress (4-6/10) - moderate range
    recommendations.push({
      id: 'stress-medium',
      title: "😐 Moderate Stress Level",
      description: `Your predicted stress level is ${predictedStressLevel.toFixed(1)}/10. This is manageable, but consider incorporating more stress-reduction activities like meditation, exercise, or hobbies to keep it lower.`,
      xp: 20,
      priority: 'low'
    });
  } else if (predictedStressLevel < 3) {
    // Very low stress (< 3/10)
    recommendations.push({
      id: 'stress-very-low',
      title: "😌 Excellent Stress Management",
      description: `Your predicted stress level is ${predictedStressLevel.toFixed(1)}/10. Great job maintaining low stress! Keep up your healthy habits.`,
      xp: 20,
      priority: 'low'
    });
  }
  
  // Sort recommendations by priority (high -> medium -> low)
  const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

// Random Forest Feature Importance Weights (normalized to sum to 1)
// These should be calculated from your RF model and updated here
// See habit_builder/UPDATE_WEIGHTS.md for instructions
// Try to load from JSON file, fallback to defaults
let FEATURE_WEIGHTS;
try {
  const weightsPath = join(__dirname, '../habit_builder/models/feature_weights.json');
  if (existsSync(weightsPath)) {
    const weightsData = readFileSync(weightsPath, 'utf8');
    FEATURE_WEIGHTS = JSON.parse(weightsData);
    console.log('Loaded feature weights from habit_builder/models/feature_weights.json');
  } else {
    throw new Error('Weights file not found');
  }
} catch (error) {
  console.warn('Could not load feature weights, using default values:', error.message);
  // Default weights (update these with your actual RF model weights)
  FEATURE_WEIGHTS = {
    sleep_hours: 0.25,          // Update with actual RF weight
    screen_time_hours: 0.20,    // Update with actual RF weight
    exercise_minutes: 0.25,     // Update with actual RF weight
    water_intake_liters: 0.15,  // Update with actual RF weight
    meditation_minutes: 0.15    // Update with actual RF weight
  };
}

// Compute penalties for each feature (0-1 scale)
function computePenalties(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes) {
  // Sleep: ideal ~7-9; penalty grows as you move away from 8
  const sleep_penalty = Math.min(1.0, Math.abs(sleepHours - 8) / 4);  // 0 if 8h, ~1 if 4h or 12h
  
  // Screen time: ideal <= 4h
  const screen_penalty = Math.min(1.0, Math.max(0, (screenTimeHours - 4) / 6));  // 4h→0, 10h→~1
  
  // Exercise: ideal >= 30 min
  const exercise_penalty = Math.min(1.0, Math.max(0, (30 - exerciseMinutes) / 30));  // 30+→0, 0→1
  
  // Water: ideal ~2-3L (optimal: 2.5L)
  // Penalty grows as you move away from 2.5L
  const idealWater = 2.5;
  const water_penalty = Math.min(1.0, Math.abs(waterIntakeLiters - idealWater) / 1.5);  // 2.5L→0, <1L or >4L→~1
  
  // Meditation: ideal ~10-20 min, but softer
  const meditation_penalty = Math.min(1.0, Math.max(0, (10 - meditationMinutes) / 10));
  
  return {
    sleep_penalty,
    screen_penalty,
    exercise_penalty,
    water_penalty,
    meditation_penalty
  };
}

// Calculate MindGene score using penalty-based system with RF weights
function calculateMindGeneScore(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes) {
  const penalties = computePenalties(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes);
  
  // Weighted sum of penalties using RF feature importance weights
  const weighted_sum = (
    FEATURE_WEIGHTS.sleep_hours * penalties.sleep_penalty +
    FEATURE_WEIGHTS.screen_time_hours * penalties.screen_penalty +
    FEATURE_WEIGHTS.exercise_minutes * penalties.exercise_penalty +
    FEATURE_WEIGHTS.water_intake_liters * penalties.water_penalty +
    FEATURE_WEIGHTS.meditation_minutes * penalties.meditation_penalty
  );
  
  // Convert 0-1 → 0-100
  const score = Math.round(100 * weighted_sum);
  
  return Math.max(0, Math.min(100, score));
}

// Calculate baseline stress for optimal inputs
function calculateOptimalBaseline() {
  // Optimal inputs (ideal values)
  const optimalSleep = 8.0;           // Ideal sleep
  const optimalScreen = 4.0;          // Ideal screen time (low)
  const optimalExercise = 30.0;       // Minimum recommended exercise
  const optimalWater = 2.5;           // Ideal water intake
  const optimalMeditation = 10.0;     // Minimum recommended meditation

  // Standardize optimal inputs
  const sleep_scaled = standardize(optimalSleep, SCALER_MEANS.sleep_hours, SCALER_STDS.sleep_hours);
  const screen_scaled = standardize(optimalScreen, SCALER_MEANS.screen_time_hours, SCALER_STDS.screen_time_hours);
  const exercise_scaled = standardize(optimalExercise, SCALER_MEANS.exercise_minutes, SCALER_STDS.exercise_minutes);
  const water_scaled = standardize(optimalWater, SCALER_MEANS.water_intake_liters, SCALER_STDS.water_intake_liters);
  const meditation_scaled = standardize(optimalMeditation, SCALER_MEANS.meditation_minutes, SCALER_STDS.meditation_minutes);

  // Calculate stress for optimal inputs
  const optimalStress = LR_INTERCEPT +
    (LR_COEFFICIENTS.sleep_hours * sleep_scaled) +
    (LR_COEFFICIENTS.screen_time_hours * screen_scaled) +
    (LR_COEFFICIENTS.exercise_minutes * exercise_scaled) +
    (LR_COEFFICIENTS.water_intake_liters * water_scaled) +
    (LR_COEFFICIENTS.meditation_minutes * meditation_scaled);

  return optimalStress;
}

// Predict stress level using linear regression (adjusted to scale optimal inputs to low stress)
function predictStressLevel(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes) {
  // Standardize each feature
  const sleep_scaled = standardize(sleepHours, SCALER_MEANS.sleep_hours, SCALER_STDS.sleep_hours);
  const screen_scaled = standardize(screenTimeHours, SCALER_MEANS.screen_time_hours, SCALER_STDS.screen_time_hours);
  const exercise_scaled = standardize(exerciseMinutes, SCALER_MEANS.exercise_minutes, SCALER_STDS.exercise_minutes);
  const water_scaled = standardize(waterIntakeLiters, SCALER_MEANS.water_intake_liters, SCALER_STDS.water_intake_liters);
  const meditation_scaled = standardize(meditationMinutes, SCALER_MEANS.meditation_minutes, SCALER_STDS.meditation_minutes);

  // Calculate predicted stress level using raw model
  const rawPredictedStress = LR_INTERCEPT +
    (LR_COEFFICIENTS.sleep_hours * sleep_scaled) +
    (LR_COEFFICIENTS.screen_time_hours * screen_scaled) +
    (LR_COEFFICIENTS.exercise_minutes * exercise_scaled) +
    (LR_COEFFICIENTS.water_intake_liters * water_scaled) +
    (LR_COEFFICIENTS.meditation_minutes * meditation_scaled);

  // Calculate optimal baseline (stress level for ideal inputs)
  const optimalBaseline = calculateOptimalBaseline();
  
  // Use penalty-based score to determine how "good" the inputs are
  // This gives us a more intuitive measure than raw model output
  const penalties = computePenalties(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes);
  const totalPenalty = (
    FEATURE_WEIGHTS.sleep_hours * penalties.sleep_penalty +
    FEATURE_WEIGHTS.screen_time_hours * penalties.screen_penalty +
    FEATURE_WEIGHTS.exercise_minutes * penalties.exercise_penalty +
    FEATURE_WEIGHTS.water_intake_liters * penalties.water_penalty +
    FEATURE_WEIGHTS.meditation_minutes * penalties.meditation_penalty
  );
  
  // Penalty is 0-1, where 0 = optimal, 1 = worst
  // Scale to stress level: 0 penalty → 0.5/10, 1 penalty → 10.0/10
  // Use piecewise scaling with very aggressive curve for bad inputs
  let scaledStress;
  if (totalPenalty >= 0.3) {
    // For bad inputs (penalty 0.3+), use very aggressive scaling to get close to 10/10
    // Map 0.3 → ~4.0, 1.0 → 10.0
    // Use exponential scaling for the bad range to push high penalties even closer to 10
    const badRange = totalPenalty - 0.3; // 0 to 0.7
    const normalizedBad = badRange / 0.7; // 0 to 1
    // Use power curve to make high penalties scale very aggressively
    const aggressiveScale = Math.pow(normalizedBad, 0.4); // Makes high penalties scale very aggressively
    scaledStress = 4.0 + (aggressiveScale * 6.0); // Scale to 4.0-10.0
  } else {
    // For good inputs, use gentler scaling
    // Map 0 → 0.5, 0.3 → 4.0
    scaledStress = 0.5 + (totalPenalty / 0.3) * 3.5;
  }
  
  // Clamp to reasonable range (0.5-10)
  return Math.max(0.5, Math.min(10, scaledStress));
}

// Calculate impact score
app.post('/api/calculate-score', async (req, res) => {
  try {
    const { sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes } = req.body;

    // Use provided values, but handle undefined/null (not 0, which is a valid input)
    const sleep = sleepHours !== undefined && sleepHours !== null ? sleepHours : 7;
    const screen = screenTimeHours !== undefined && screenTimeHours !== null ? screenTimeHours : 6;
    const exercise = exerciseMinutes !== undefined && exerciseMinutes !== null ? exerciseMinutes : 30;
    const water = waterIntakeLiters !== undefined && waterIntakeLiters !== null ? waterIntakeLiters : 2.5;
    const meditation = meditationMinutes !== undefined && meditationMinutes !== null ? meditationMinutes : 0;

    // Use penalty-based MindGene scoring system
    const score = calculateMindGeneScore(sleep, screen, exercise, water, meditation);

    // Also predict stress level for recommendations (using linear regression)
    const predictedStressLevel = predictStressLevel(sleep, screen, exercise, water, meditation);

    // Category based on MindGene score (lower score = better, higher score = worse)
    // Score is 0-100 where 0 is best and 100 is worst
    let category;
    if (score <= 33) {
      category = 'High'; // Low penalty score = High biological health
    } else if (score >= 34 && score <= 66) {
      category = 'Moderate';
    } else {
      category = 'Low'; // High penalty score = Low biological health
    }

    // Compute penalties once for use in message and persona
    const penalties = computePenalties(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes);
    
    // Generate message based on MindGene score and factors
    let message = '';
    
    if (category === 'High') {
      // Low penalty score = High biological health
      if (penalties.sleep_penalty < 0.25 && penalties.screen_penalty < 0.5 && penalties.exercise_penalty < 0.5) {
        message = 'Your biological impact score reflects excellent lifestyle balance. Your sleep patterns are optimal, screen time is well-managed, and your exercise routine supports good wellness. Continue maintaining these positive habits for sustained wellness.';
      } else if (penalties.sleep_penalty >= 0.5) {
        message = 'Your biological impact score is high, but sleep quality needs attention. While your other lifestyle factors are contributing positively, improving sleep duration to 7-9 hours will further enhance your overall biological health.';
      } else {
        message = 'Your biological impact score is high, indicating strong overall wellness. Your lifestyle choices support good biological health. Keep up the excellent work!';
      }
    } else if (category === 'Moderate') {
      if (penalties.sleep_penalty >= 0.5 && penalties.exercise_penalty >= 0.5) {
        message = 'Your biological impact score is moderate, with both sleep and exercise areas needing improvement. Focus on establishing a consistent sleep schedule of 7-9 hours and increasing physical activity to at least 30 minutes daily. These changes will significantly improve your biological wellness.';
      } else if (penalties.sleep_penalty >= 0.5) {
        message = 'Your biological impact score is moderate, primarily due to sleep patterns that deviate from the optimal 7-9 hour range. Your other lifestyle factors are reasonable, but improving sleep quality and duration would boost your biological health.';
      } else if (penalties.screen_penalty >= 0.5 || penalties.exercise_penalty >= 0.5) {
        message = 'Your biological impact score is moderate, with lifestyle factors like screen time or exercise levels affecting your wellness. Your sleep patterns are adequate, but balancing screen usage and increasing physical activity would enhance your biological health.';
      } else {
        message = 'Your biological impact score is moderate, indicating a balanced but improvable wellness profile. Your lifestyle habits are within acceptable ranges, but optimizing each area would move you toward better biological health.';
      }
    } else {
      // Low category = High penalty score = Poor biological health
      if (penalties.sleep_penalty >= 0.75 && penalties.exercise_penalty >= 0.75) {
        message = 'Your biological impact score is low, with both sleep and exercise requiring immediate attention. Prioritize establishing a regular sleep schedule of 7-9 hours and increasing physical activity. These fundamental changes are crucial for improving your biological wellness.';
      } else if (penalties.sleep_penalty >= 0.75) {
        message = 'Your biological impact score is low, primarily due to significant sleep disruption. Aim for 7-9 hours of consistent sleep nightly, as this is foundational to biological health. While other factors also need attention, sleep improvement should be your top priority.';
      } else if (penalties.screen_penalty >= 0.75) {
        message = 'Your biological impact score is low, with excessive screen time significantly impacting your biological wellness. Try to limit screen time to under 4 hours daily. Your sleep patterns also need attention to support recovery.';
      } else {
        message = 'Your biological impact score is low, indicating multiple areas need improvement. Focus on establishing healthy sleep patterns (7-9 hours), reducing screen time, and increasing physical activity. These lifestyle changes will significantly improve your biological health.';
      }
    }

    // Determine persona based on penalties and factors
    let persona, personaDescription;
    
    if (penalties.sleep_penalty >= 0.5 && penalties.screen_penalty >= 0.5 && screenTimeHours >= 6) {
      persona = '🔥 Wired Night Owl';
      personaDescription = 'Low sleep combined with high screen time suggests disrupted recovery patterns.';
    } else if (penalties.exercise_penalty >= 0.75 && exerciseMinutes < 15) {
      persona = '📉 Flat-Lined & Exhausted';
      personaDescription = 'Low movement indicates depleted energy and reduced resilience.';
    } else if (penalties.screen_penalty >= 0.5 && screenTimeHours > 8) {
      persona = '📱 Doomscrolling Achiever';
      personaDescription = 'High screen time suggests cognitive overload and poor recovery.';
    } else if (score <= 33) {
      persona = '🧘 Resilient Baseline';
      personaDescription = 'Your patterns show overall balanced lifestyle and good biological health.';
    } else {
      persona = '🌱 Growing Wellness';
      personaDescription = 'Your patterns show room for improvement, but you\'re on the right track.';
    }

    // Generate recommendations based on user's metrics
    const recommendations = generateRecommendations(
      sleepHours,
      screenTimeHours,
      exerciseMinutes,
      waterIntakeLiters,
      meditationMinutes,
      predictedStressLevel
    );

    res.json({
      score,
      category,
      message,
      persona,
      personaDescription,
      predictedStressLevel: Math.round(predictedStressLevel * 10) / 10, // Round to 1 decimal
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete a recommendation
app.post('/api/complete-recommendation', async (req, res) => {
  try {
    const { userId = 'default', recommendationId } = req.body;
    
    const data = await readData();
    let userData = await getUserData(userId);
    
    // Check if already completed today
    const today = new Date().toISOString().split('T')[0];
    const hasSubmittedToday = userData.lastCheckinDate === today;
    
    if (!hasSubmittedToday) {
      return res.status(400).json({ error: 'Please submit your daily metrics first' });
    }
    
    // Check if recommendation was already completed
    if (!userData.completedRecommendations) {
      userData.completedRecommendations = [];
    }
    
    if (userData.completedRecommendations.includes(recommendationId)) {
      return res.status(400).json({ error: 'Recommendation already completed' });
    }
    
    // Award XP
    const xpAmount = 20;
    userData.xp += xpAmount;
    userData.points += 25;
    
    // Mark as completed
    userData.completedRecommendations.push(recommendationId);
    
    // Check for level up
    let levelUp = null;
    const levelCheck = checkForLevelUp(userData);
    if (levelCheck.leveledUp && levelCheck.newLevel) {
      userData.level = levelCheck.newLevel;
      userData.xpToNextLevel = calculateXPToNextLevel(levelCheck.newLevel);
      levelUp = levelCheck.newLevel;
    }
    
    // Save user data
    data.users[userId] = userData;
    await writeData(data);
    
    res.json({
      userData,
      xpGain: { amount: xpAmount, reason: 'Recommendation Completed' },
      levelUp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit daily check-in
app.post('/api/checkin', async (req, res) => {
  try {
    const { userId = 'default', sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes, score } = req.body;
    
    const data = await readData();
    let userData = await getUserData(userId);
    
    // Check if user has already submitted today
    const today = new Date().toISOString().split('T')[0];
    const hasSubmittedToday = userData.lastCheckinDate === today;
    
    // Reset completed recommendations if it's a new day
    if (!hasSubmittedToday) {
      userData.completedRecommendations = [];
    }
    
    // Update login streak (only if not already submitted today)
    if (!hasSubmittedToday) {
      if (userData.lastCheckinDate === '') {
        userData.loginStreak = 1;
      } else {
        const lastCheckin = new Date(userData.lastCheckinDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          userData.loginStreak += 1;
        } else if (daysDiff > 1) {
          userData.loginStreak = 1;
        }
      }
    }
    
    // Update task completion streak (only if not already submitted today)
    let streakUpdate = { newData: userData, streakXP: 0 };
    if (!hasSubmittedToday) {
      streakUpdate = updateStreak(userData);
      userData = streakUpdate.newData;
    }
    
    const xpGains = [];
    let finalLevelUp = null;
    
    // Only award XP if user hasn't submitted today
    if (!hasSubmittedToday) {
      // Award login XP
      userData.xp += 5;
      xpGains.push({ amount: 5, reason: 'Daily Login' });
      const levelCheck1 = checkForLevelUp(userData);
      if (levelCheck1.leveledUp && levelCheck1.newLevel) {
        userData.level = levelCheck1.newLevel;
        userData.xpToNextLevel = calculateXPToNextLevel(levelCheck1.newLevel);
        finalLevelUp = levelCheck1.newLevel;
      }
      
      // Award streak XP
      if (streakUpdate.streakXP > 0) {
        userData.xp += streakUpdate.streakXP;
        xpGains.push({ amount: streakUpdate.streakXP, reason: `${userData.currentStreak}-Day Streak!` });
        const levelCheck2 = checkForLevelUp(userData);
        if (levelCheck2.leveledUp && levelCheck2.newLevel) {
          userData.level = levelCheck2.newLevel;
          userData.xpToNextLevel = calculateXPToNextLevel(levelCheck2.newLevel);
          finalLevelUp = levelCheck2.newLevel;
        }
      }
      
      // Award XP for completing all daily inputs
      userData.xp += 10;
      userData.points += 25;
      xpGains.push({ amount: 10, reason: 'Daily Tasks Completed' });
      const levelCheck3 = checkForLevelUp(userData);
      if (levelCheck3.leveledUp && levelCheck3.newLevel) {
        userData.level = levelCheck3.newLevel;
        userData.xpToNextLevel = calculateXPToNextLevel(levelCheck3.newLevel);
        finalLevelUp = levelCheck3.newLevel;
      }
      
      // Award XP for completing recommended tasks (if score is good)
      if (score >= 40) {
        userData.xp += 20;
        xpGains.push({ amount: 20, reason: 'Completed Recommended Tasks' });
        const levelCheck4 = checkForLevelUp(userData);
        if (levelCheck4.leveledUp && levelCheck4.newLevel) {
          userData.level = levelCheck4.newLevel;
          userData.xpToNextLevel = calculateXPToNextLevel(levelCheck4.newLevel);
          finalLevelUp = levelCheck4.newLevel;
        }
      }
    }
    
    // Mark daily tasks as completed and update last checkin date
    userData.dailyTasksCompleted = true;
    userData.lastCheckinDate = today;
    
    // Check and unlock badges
    const newBadges = checkBadgeConditions(userData);
    newBadges.forEach((badgeId) => {
      if (!userData.badgesUnlocked.includes(badgeId)) {
        userData.badgesUnlocked.push(badgeId);
      }
    });
    
    // Save user data
    data.users[userId] = userData;
    await writeData(data);
    
    res.json({
      userData,
      xpGains,
      levelUp: finalLevelUp,
      newBadges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

