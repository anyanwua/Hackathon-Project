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

// Calculate impact score
export async function calculateScore(
  sleepHours: number,
  stressLevel: number,
  screenTimeHours: number,
  exerciseMinutes: number,
  moodLevel: number
): Promise<ScoreResult> {
  const response = await fetch(`${API_BASE_URL}/api/calculate-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sleepHours,
      stressLevel,
      screenTimeHours,
      exerciseMinutes,
      moodLevel,
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
  stressLevel: number,
  screenTimeHours: number,
  exerciseMinutes: number,
  moodLevel: number,
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
      stressLevel,
      screenTimeHours,
      exerciseMinutes,
      moodLevel,
      score,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit check-in');
  }

  return response.json();
}

// Map calm-quest factors to MindGene scoring system
export function mapFactorsToScoring(factors: {
  sleep: number;
  workload: number;
  exercise: number;
  social: number;
  nutrition: number;
}) {
  // Map calm-quest factors to MindGene inputs:
  // sleep: hours (0-12) - direct mapping
  // workload: stress level (0-10) -> map to 1-5 scale
  // exercise: (0-10) -> map to minutes (0-180)
  // social: not directly used, but can influence mood
  // nutrition: not directly used, but can influence mood
  
  const sleepHours = factors.sleep;
  const stressLevel = Math.ceil((factors.workload / 10) * 5); // Map 0-10 to 1-5
  const exerciseMinutes = (factors.exercise / 10) * 180; // Map 0-10 to 0-180
  const screenTimeHours = 6; // Default, could be added to calm-quest later
  const moodLevel = Math.ceil(((factors.social + factors.nutrition) / 2 / 10) * 5); // Average social + nutrition, map to 1-5
  
  return {
    sleepHours,
    stressLevel: Math.max(1, Math.min(5, stressLevel)),
    screenTimeHours,
    exerciseMinutes: Math.round(exerciseMinutes),
    moodLevel: Math.max(1, Math.min(5, moodLevel)),
  };
}

