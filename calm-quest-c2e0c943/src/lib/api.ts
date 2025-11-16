const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface UserData {
  xp: number;
  level: number;
  xpToNextLevel: number;
  currentStreak: number;
  lastCheckinDate: string;
  loginStreak: number;
  badgesUnlocked: string[];
  dailyTasksCompleted: boolean;
  points: number;
}

export interface ScoreResult {
  score: number;
  category: 'Low' | 'Moderate' | 'High';
  message: string;
  persona: string;
  personaDescription: string;
  predictedStressLevel?: number;
}

export interface CheckinResponse {
  userData: UserData;
  xpGains: Array<{ amount: number; reason: string }>;
  levelUp: number | null;
  newBadges: string[];
}

// Get user data
export async function getUserData(userId: string = 'default'): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  return response.json();
}

// Calculate impact score using linear regression model
export async function calculateScore(
  sleepHours: number,
  screenTimeHours: number,
  exerciseMinutes: number,
  waterIntakeLiters: number,
  meditationMinutes: number
): Promise<ScoreResult> {
  const response = await fetch(`${API_BASE_URL}/api/calculate-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sleepHours,
      screenTimeHours,
      exerciseMinutes,
      waterIntakeLiters,
      meditationMinutes,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate score');
  }

  return response.json();
}

// Submit daily check-in
export async function submitCheckin(
  userId: string,
  sleepHours: number,
  screenTimeHours: number,
  exerciseMinutes: number,
  waterIntakeLiters: number,
  meditationMinutes: number,
  score: number
): Promise<CheckinResponse> {
  const response = await fetch(`${API_BASE_URL}/api/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      sleepHours,
      screenTimeHours,
      exerciseMinutes,
      waterIntakeLiters,
      meditationMinutes,
      score,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit check-in');
  }

  return response.json();
}

// Map calm-quest factors to linear regression model inputs
export function mapFactorsToScoring(factors: {
  sleep: number;
  workload: number;
  exercise: number;
  social: number;
  nutrition: number;
}) {
  // Map calm-quest factors to linear regression model inputs:
  // sleep: hours (0-12) - direct mapping
  // exercise: (0-10) -> map to minutes (0-180)
  // screen_time: estimate from workload (higher workload = more screen time)
  // water_intake: estimate from nutrition (better nutrition = more water)
  // meditation: estimate from social (more social = less meditation needed, but we'll use inverse)
  
  const sleepHours = factors.sleep;
  const exerciseMinutes = (factors.exercise / 10) * 180; // Map 0-10 to 0-180
  const screenTimeHours = 3 + (factors.workload / 10) * 7; // Map 0-10 workload to 3-10 hours screen time
  const waterIntakeLiters = 1.5 + (factors.nutrition / 10) * 2; // Map 0-10 nutrition to 1.5-3.5L water
  const meditationMinutes = (10 - factors.social) * 2; // Inverse: less social = more meditation needed (0-20 min)
  
  return {
    sleepHours,
    screenTimeHours: Math.max(0, Math.min(16, screenTimeHours)),
    exerciseMinutes: Math.round(Math.max(0, Math.min(180, exerciseMinutes))),
    waterIntakeLiters: Math.max(0.5, Math.min(5, waterIntakeLiters)),
    meditationMinutes: Math.max(0, Math.min(60, meditationMinutes)),
  };
}

