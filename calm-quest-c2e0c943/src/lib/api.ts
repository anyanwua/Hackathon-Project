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
  completedRecommendations?: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  xp: number;
}

export interface ScoreResult {
  score: number;
  category: 'Low' | 'Moderate' | 'High';
  message: string;
  persona: string;
  personaDescription: string;
  predictedStressLevel?: number;
  recommendations?: Recommendation[];
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

// Complete a recommendation
export async function completeRecommendation(
  userId: string = 'default',
  recommendationId: string
): Promise<{ userData: UserData; xpGain: { amount: number; reason: string }; levelUp: number | null }> {
  const response = await fetch(`${API_BASE_URL}/api/complete-recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      recommendationId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete recommendation');
  }

  return response.json();
}


