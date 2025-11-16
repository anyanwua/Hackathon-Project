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

// Calculate impact score
app.post('/api/calculate-score', async (req, res) => {
  try {
    const { sleepHours, stressLevel, screenTimeHours, exerciseMinutes, moodLevel } = req.body;

    // Calculate penalty values
    const sleepPenalty = Math.max(0, Math.abs(sleepHours - 8) / 8);
    const stressPenalty = (stressLevel - 1) / 4;
    const screenPenalty = Math.max(0, (screenTimeHours - 4) / 8);
    const exercisePenalty = Math.max(0, (30 - exerciseMinutes) / 60);
    const moodPenalty = (5 - moodLevel) / 4;

    // Weighted sum
    const raw =
      0.30 * sleepPenalty +
      0.25 * stressPenalty +
      0.20 * screenPenalty +
      0.15 * exercisePenalty +
      0.10 * moodPenalty;

    // Convert to 0-100
    const score = Math.max(0, Math.min(100, Math.round(raw * 100)));

    // Category
    let category;
    if (score <= 33) {
      category = 'Low';
    } else if (score >= 34 && score <= 66) {
      category = 'Moderate';
    } else {
      category = 'High';
    }

    // Generate message
    let message = '';
    if (category === 'High') {
      if (sleepPenalty < 0.25 && stressPenalty < 0.5 && screenPenalty < 0.5) {
        message = 'Your biological impact score reflects excellent lifestyle balance. Your sleep patterns are optimal, stress levels are well-managed, and screen time is within healthy limits. Continue maintaining these positive habits for sustained wellness.';
      } else if (sleepPenalty >= 0.5) {
        message = 'Your biological impact score is high, but sleep quality needs attention. While your stress management and lifestyle choices are contributing positively, improving sleep duration and consistency will further enhance your overall biological health.';
      } else if (stressPenalty >= 0.75) {
        message = 'Your biological impact score is high, though stress management could be improved. Your sleep and lifestyle habits are solid, but reducing stress through mindfulness or relaxation techniques would optimize your biological wellness.';
      } else {
        message = 'Your biological impact score is high, indicating strong overall wellness. Your sleep and stress management are on track, and your lifestyle choices support good biological health. Keep up the excellent work!';
      }
    } else if (category === 'Moderate') {
      if (sleepPenalty >= 0.5 && stressPenalty >= 0.5) {
        message = 'Your biological impact score is moderate, with both sleep and stress areas needing improvement. Focus on establishing a consistent sleep schedule of 7-9 hours and implementing stress-reduction strategies. These changes will significantly improve your biological wellness.';
      } else if (sleepPenalty >= 0.5) {
        message = 'Your biological impact score is moderate, primarily due to sleep patterns that deviate from the optimal 8-hour range. Your stress management and lifestyle choices are reasonable, but improving sleep quality and duration would boost your biological health.';
      } else if (stressPenalty >= 0.5) {
        message = 'Your biological impact score is moderate, with elevated stress levels being a key factor. Your sleep patterns are decent, but implementing stress management techniques such as meditation, exercise, or time management would improve your overall biological wellness.';
      } else if (screenPenalty >= 0.5 || exercisePenalty >= 0.5) {
        message = 'Your biological impact score is moderate, with lifestyle factors like screen time or exercise levels affecting your wellness. Your sleep and stress management are adequate, but balancing screen usage and increasing physical activity would enhance your biological health.';
      } else {
        message = 'Your biological impact score is moderate, indicating a balanced but improvable wellness profile. Your sleep, stress, and lifestyle habits are within acceptable ranges, but optimizing each area would move you toward better biological health.';
      }
    } else {
      if (sleepPenalty >= 0.75 && stressPenalty >= 0.75) {
        message = 'Your biological impact score is low, with both sleep and stress requiring immediate attention. Prioritize establishing a regular sleep schedule of 7-9 hours and implementing daily stress-reduction practices. These fundamental changes are crucial for improving your biological wellness.';
      } else if (sleepPenalty >= 0.75) {
        message = 'Your biological impact score is low, primarily due to significant sleep disruption. Aim for 7-9 hours of consistent sleep nightly, as this is foundational to biological health. While stress and lifestyle factors also need attention, sleep improvement should be your top priority.';
      } else if (stressPenalty >= 0.75) {
        message = 'Your biological impact score is low, with high stress levels significantly impacting your biological wellness. Implement stress management strategies immediately—consider meditation, regular exercise, or professional support. Your sleep patterns also need attention to support stress recovery.';
      } else {
        message = 'Your biological impact score is low, indicating multiple areas need improvement. Focus on establishing healthy sleep patterns (7-9 hours), reducing stress through proven techniques, and balancing screen time with physical activity. These lifestyle changes will significantly improve your biological health.';
      }
    }

    // Determine persona
    let persona, personaDescription;
    if (sleepHours < 6 && stressLevel >= 4 && screenTimeHours >= 6) {
      persona = '🔥 Wired Night Owl';
      personaDescription = 'Low sleep combined with high stress and high screen time suggests disrupted recovery patterns.';
    } else if (exerciseMinutes < 15 && moodLevel <= 2) {
      persona = '📉 Flat-Lined & Exhausted';
      personaDescription = 'Low movement and low mood indicate depleted energy and reduced resilience.';
    } else if (screenTimeHours > 8 && stressLevel >= 3) {
      persona = '📱 Doomscrolling Achiever';
      personaDescription = 'High screen time with moderate stress suggests cognitive overload and poor recovery.';
    } else {
      persona = '🧘 Resilient Baseline';
      personaDescription = 'Your patterns show overall balanced stress and recovery.';
    }

    res.json({
      score,
      category,
      message,
      persona,
      personaDescription
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit daily check-in
app.post('/api/checkin', async (req, res) => {
  try {
    const { userId = 'default', sleepHours, stressLevel, screenTimeHours, exerciseMinutes, moodLevel, score } = req.body;
    
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

