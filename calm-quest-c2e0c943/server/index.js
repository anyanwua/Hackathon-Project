import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

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
      points: 0
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

// Check for level up
function checkForLevelUp(userData) {
  if (userData.xp >= userData.xpToNextLevel) {
    const newLevel = userData.level + 1;
    return {
      leveledUp: true,
      newLevel
    };
  }
  return { leveledUp: false };
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

// Linear Regression Model Parameters (from Venture Track)
// StandardScaler means and stds (estimated from dataset preview)
// Based on sample data: sleep ~6-8.5h, screen ~3.7-7.4h, exercise ~40-75min, water ~2.4-3.7L, meditation ~0-25min
const SCALER_MEANS = {
  sleep_hours: 7.2,
  screen_time_hours: 5.8,
  exercise_minutes: 54.0,
  water_intake_liters: 3.0,
  meditation_minutes: 11.0
};

const SCALER_STDS = {
  sleep_hours: 0.8,
  screen_time_hours: 1.5,
  exercise_minutes: 12.0,
  water_intake_liters: 0.5,
  meditation_minutes: 9.0
};

// Linear Regression Coefficients (from standardized model)
const LR_COEFFICIENTS = {
  exercise_minutes: 0.278286,
  screen_time_hours: 0.038877,
  sleep_hours: -0.006555,
  water_intake_liters: -0.008884,
  meditation_minutes: -0.047862
};

const LR_INTERCEPT = 5.108866889054614;

// Standardize a value
function standardize(value, mean, std) {
  return (value - mean) / std;
}

// Predict stress level using linear regression
function predictStressLevel(sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes) {
  // Standardize each feature
  const sleep_scaled = standardize(sleepHours, SCALER_MEANS.sleep_hours, SCALER_STDS.sleep_hours);
  const screen_scaled = standardize(screenTimeHours, SCALER_MEANS.screen_time_hours, SCALER_STDS.screen_time_hours);
  const exercise_scaled = standardize(exerciseMinutes, SCALER_MEANS.exercise_minutes, SCALER_STDS.exercise_minutes);
  const water_scaled = standardize(waterIntakeLiters, SCALER_MEANS.water_intake_liters, SCALER_STDS.water_intake_liters);
  const meditation_scaled = standardize(meditationMinutes, SCALER_MEANS.meditation_minutes, SCALER_STDS.meditation_minutes);

  // Calculate predicted stress level
  const predictedStress = LR_INTERCEPT +
    (LR_COEFFICIENTS.sleep_hours * sleep_scaled) +
    (LR_COEFFICIENTS.screen_time_hours * screen_scaled) +
    (LR_COEFFICIENTS.exercise_minutes * exercise_scaled) +
    (LR_COEFFICIENTS.water_intake_liters * water_scaled) +
    (LR_COEFFICIENTS.meditation_minutes * meditation_scaled);

  // Clamp to reasonable range (0-10)
  return Math.max(0, Math.min(10, predictedStress));
}

// Calculate impact score
app.post('/api/calculate-score', async (req, res) => {
  try {
    const { sleepHours, screenTimeHours, exerciseMinutes, waterIntakeLiters, meditationMinutes } = req.body;

    // Predict stress level using linear regression model
    const predictedStressLevel = predictStressLevel(
      sleepHours || 7,
      screenTimeHours || 6,
      exerciseMinutes || 30,
      waterIntakeLiters || 2.5,
      meditationMinutes || 0
    );

    // Convert predicted stress (0-10) to biological impact score (0-100)
    // Higher stress = lower biological health score
    // Invert: stress 0 = score 100, stress 10 = score 0
    const score = Math.max(0, Math.min(100, Math.round(100 - (predictedStressLevel * 10))));

    // Category based on predicted stress level
    let category;
    if (predictedStressLevel <= 3.3) {
      category = 'High'; // Low stress = High biological health
    } else if (predictedStressLevel >= 3.4 && predictedStressLevel <= 6.6) {
      category = 'Moderate';
    } else {
      category = 'Low'; // High stress = Low biological health
    }

    // Generate message based on predicted stress and factors
    let message = '';
    if (category === 'High') {
      if (sleepHours >= 7 && sleepHours <= 9 && predictedStressLevel <= 3) {
        message = 'Your biological impact score reflects excellent lifestyle balance. Your sleep patterns are optimal, predicted stress levels are low, and your lifestyle factors support good wellness. Continue maintaining these positive habits for sustained wellness.';
      } else if (sleepHours < 7) {
        message = 'Your biological impact score is high, but sleep quality needs attention. While your predicted stress level is manageable, improving sleep duration to 7-9 hours will further enhance your overall biological health.';
      } else {
        message = 'Your biological impact score is high, indicating strong overall wellness. Your predicted stress level is low, and your lifestyle choices support good biological health. Keep up the excellent work!';
      }
    } else if (category === 'Moderate') {
      if (sleepHours < 7 && predictedStressLevel >= 5) {
        message = 'Your biological impact score is moderate, with both sleep and predicted stress levels needing improvement. Focus on establishing a consistent sleep schedule of 7-9 hours and implementing stress-reduction strategies. These changes will significantly improve your biological wellness.';
      } else if (sleepHours < 7) {
        message = 'Your biological impact score is moderate, primarily due to sleep patterns that deviate from the optimal 7-9 hour range. Your predicted stress level is manageable, but improving sleep quality and duration would boost your biological health.';
      } else if (predictedStressLevel >= 5) {
        message = 'Your biological impact score is moderate, with elevated predicted stress levels being a key factor. Your sleep patterns are decent, but implementing stress management techniques such as meditation, exercise, or time management would improve your overall biological wellness.';
      } else {
        message = 'Your biological impact score is moderate, indicating a balanced but improvable wellness profile. Your sleep and predicted stress levels are within acceptable ranges, but optimizing each area would move you toward better biological health.';
      }
    } else {
      if (sleepHours < 6 && predictedStressLevel >= 7) {
        message = 'Your biological impact score is low, with both sleep and predicted stress levels requiring immediate attention. Prioritize establishing a regular sleep schedule of 7-9 hours and implementing daily stress-reduction practices. These fundamental changes are crucial for improving your biological wellness.';
      } else if (sleepHours < 6) {
        message = 'Your biological impact score is low, primarily due to significant sleep disruption. Aim for 7-9 hours of consistent sleep nightly, as this is foundational to biological health. While predicted stress levels also need attention, sleep improvement should be your top priority.';
      } else if (predictedStressLevel >= 7) {
        message = 'Your biological impact score is low, with high predicted stress levels significantly impacting your biological wellness. Implement stress management strategies immediately—consider meditation, regular exercise, or professional support. Your sleep patterns also need attention to support stress recovery.';
      } else {
        message = 'Your biological impact score is low, indicating multiple areas need improvement. Focus on establishing healthy sleep patterns (7-9 hours), reducing stress through proven techniques, and balancing screen time with physical activity. These lifestyle changes will significantly improve your biological health.';
      }
    }

    // Determine persona based on predicted stress and factors
    let persona, personaDescription;
    if (sleepHours < 6 && predictedStressLevel >= 6 && screenTimeHours >= 6) {
      persona = '🔥 Wired Night Owl';
      personaDescription = 'Low sleep combined with high predicted stress and high screen time suggests disrupted recovery patterns.';
    } else if (exerciseMinutes < 15 && predictedStressLevel >= 6) {
      persona = '📉 Flat-Lined & Exhausted';
      personaDescription = 'Low movement and high predicted stress indicate depleted energy and reduced resilience.';
    } else if (screenTimeHours > 8 && predictedStressLevel >= 5) {
      persona = '📱 Doomscrolling Achiever';
      personaDescription = 'High screen time with moderate predicted stress suggests cognitive overload and poor recovery.';
    } else {
      persona = '🧘 Resilient Baseline';
      personaDescription = 'Your patterns show overall balanced stress and recovery.';
    }

    res.json({
      score,
      category,
      message,
      persona,
      personaDescription,
      predictedStressLevel: Math.round(predictedStressLevel * 10) / 10 // Round to 1 decimal
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
    
    // Update login streak
    const today = new Date().toISOString().split('T')[0];
    if (userData.lastCheckinDate !== today) {
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
    
    // Update task completion streak
    const streakUpdate = updateStreak(userData);
    userData = streakUpdate.newData;
    
    const xpGains = [];
    let finalLevelUp = null;
    
    // Award login XP
    if (userData.loginStreak === 1 || (userData.loginStreak > 1 && userData.lastCheckinDate !== today)) {
      userData.xp += 5;
      xpGains.push({ amount: 5, reason: 'Daily Login' });
      const levelCheck = checkForLevelUp(userData);
      if (levelCheck.leveledUp) {
        userData.level = levelCheck.newLevel;
        userData.xpToNextLevel = calculateXPToNextLevel(levelCheck.newLevel);
        finalLevelUp = levelCheck.newLevel;
      }
    }
    
    // Award streak XP
    if (streakUpdate.streakXP > 0) {
      userData.xp += streakUpdate.streakXP;
      xpGains.push({ amount: streakUpdate.streakXP, reason: `${userData.currentStreak}-Day Streak!` });
      const levelCheck = checkForLevelUp(userData);
      if (levelCheck.leveledUp) {
        userData.level = levelCheck.newLevel;
        userData.xpToNextLevel = calculateXPToNextLevel(levelCheck.newLevel);
        finalLevelUp = levelCheck.newLevel;
      }
    }
    
    // Mark daily tasks as completed
    userData.dailyTasksCompleted = true;
    
    // Award XP for completing all daily inputs
    userData.xp += 10;
    userData.points += 25;
    xpGains.push({ amount: 10, reason: 'Daily Tasks Completed' });
    const levelCheck = checkForLevelUp(userData);
    if (levelCheck.leveledUp) {
      userData.level = levelCheck.newLevel;
      userData.xpToNextLevel = calculateXPToNextLevel(levelCheck.newLevel);
      finalLevelUp = levelCheck.newLevel;
    }
    
    // Award XP for completing recommended tasks (if score is good)
    if (score >= 40) {
      userData.xp += 20;
      xpGains.push({ amount: 20, reason: 'Completed Recommended Tasks' });
      const levelCheck = checkForLevelUp(userData);
      if (levelCheck.leveledUp) {
        userData.level = levelCheck.newLevel;
        userData.xpToNextLevel = calculateXPToNextLevel(levelCheck.newLevel);
        finalLevelUp = levelCheck.newLevel;
      }
    }
    
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

