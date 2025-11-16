export interface UserData {
  xp: number
  level: number
  xpToNextLevel: number
  currentStreak: number
  lastCheckinDate: string
  loginStreak: number
  badgesUnlocked: string[]
  dailyTasksCompleted: boolean
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
}

export const BADGES: Record<string, Badge> = {
  streak3: {
    id: 'streak3',
    name: 'Streak Master',
    description: 'Complete daily check-ins for 3 days in a row',
    icon: '🔥'
  },
  allTasks: {
    id: 'allTasks',
    name: 'Task Master',
    description: 'Complete all daily inputs in a single day',
    icon: '✅'
  },
  login3: {
    id: 'login3',
    name: 'Consistent Logger',
    description: 'Log in 3 days in a row',
    icon: '📅'
  }
}

const STORAGE_KEY = 'mindgene_user_data'

export function getUserData(): UserData {
  const stored = localStorage.getItem(STORAGE_KEY)
  const today = new Date().toISOString().split('T')[0]
  
  if (stored) {
    const data = JSON.parse(stored)
    // Reset dailyTasksCompleted if it's a new day
    if (data.lastCheckinDate !== today) {
      data.dailyTasksCompleted = false
    }
    return data
  }
  return {
    xp: 0,
    level: 1,
    xpToNextLevel: 30,
    currentStreak: 0,
    lastCheckinDate: '',
    loginStreak: 0,
    badgesUnlocked: [],
    dailyTasksCompleted: false
  }
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function calculateXPToNextLevel(level: number): number {
  if (level === 1) return 30
  return 30 + (level - 1) * 10
}

export function checkForLevelUp(userData: UserData): { leveledUp: boolean; newLevel?: number } {
  if (userData.xp >= userData.xpToNextLevel) {
    const newLevel = userData.level + 1
    return {
      leveledUp: true,
      newLevel
    }
  }
  return { leveledUp: false }
}

export function addXP(amount: number, _reason: string, userData: UserData): { newData: UserData; leveledUp: boolean; newLevel?: number } {
  const newXP = userData.xp + amount
  const newData = { ...userData, xp: newXP }
  
  const levelCheck = checkForLevelUp(newData)
  if (levelCheck.leveledUp && levelCheck.newLevel) {
    newData.level = levelCheck.newLevel
    newData.xpToNextLevel = calculateXPToNextLevel(levelCheck.newLevel)
  }
  
  saveUserData(newData)
  return {
    newData,
    leveledUp: levelCheck.leveledUp,
    newLevel: levelCheck.newLevel
  }
}

export function updateStreak(userData: UserData): { newData: UserData; streakXP: number } {
  const today = new Date().toISOString().split('T')[0]
  const lastDate = userData.lastCheckinDate
  let newStreak = userData.currentStreak
  let streakXP = 0

  if (lastDate === today) {
    // Already checked in today
    return { newData: userData, streakXP: 0 }
  }

  if (lastDate === '') {
    // First check-in
    newStreak = 1
  } else {
    const lastCheckin = new Date(lastDate)
    const todayDate = new Date(today)
    const daysDiff = Math.floor((todayDate.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      // Consecutive day
      newStreak = userData.currentStreak + 1
    } else if (daysDiff > 1) {
      // Streak broken
      newStreak = 1
    }
    // If daysDiff === 0, already checked in today (handled above)
  }

  // Award streak XP
  if (newStreak >= 3) {
    streakXP = 10
  } else if (newStreak >= 2) {
    streakXP = 5
  }

  const newData = {
    ...userData,
    currentStreak: newStreak,
    lastCheckinDate: today
  }

  saveUserData(newData)
  return { newData, streakXP }
}

export function updateLoginStreak(userData: UserData): { newData: UserData; loginStreakXP: number } {
  const today = new Date().toISOString().split('T')[0]
  const lastDate = userData.lastCheckinDate
  let newLoginStreak = userData.loginStreak
  let loginStreakXP = 0

  if (lastDate === today) {
    return { newData: userData, loginStreakXP: 0 }
  }

  if (lastDate === '') {
    newLoginStreak = 1
  } else {
    const lastCheckin = new Date(lastDate)
    const todayDate = new Date(today)
    const daysDiff = Math.floor((todayDate.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === 1) {
      newLoginStreak = userData.loginStreak + 1
    } else if (daysDiff > 1) {
      newLoginStreak = 1
    }
  }

  // Award login XP
  loginStreakXP = 5

  const newData = {
    ...userData,
    loginStreak: newLoginStreak,
    lastCheckinDate: today
  }

  saveUserData(newData)
  return { newData, loginStreakXP }
}

export function unlockBadge(badgeId: string, userData: UserData): { newData: UserData; unlocked: boolean } {
  if (userData.badgesUnlocked.includes(badgeId)) {
    return { newData: userData, unlocked: false }
  }

  const newData = {
    ...userData,
    badgesUnlocked: [...userData.badgesUnlocked, badgeId]
  }

  saveUserData(newData)
  return { newData, unlocked: true }
}

export function checkBadgeConditions(userData: UserData): string[] {
  const newlyUnlocked: string[] = []

  // Streak badge
  if (userData.currentStreak >= 3 && !userData.badgesUnlocked.includes('streak3')) {
    newlyUnlocked.push('streak3')
  }

  // All tasks badge (checked when daily tasks are completed)
  if (userData.dailyTasksCompleted && !userData.badgesUnlocked.includes('allTasks')) {
    newlyUnlocked.push('allTasks')
  }

  // Login streak badge
  if (userData.loginStreak >= 3 && !userData.badgesUnlocked.includes('login3')) {
    newlyUnlocked.push('login3')
  }

  return newlyUnlocked
}

