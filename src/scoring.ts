export interface Result {
  score: number
  category: 'Low' | 'Moderate' | 'High'
  explanation: string
  persona: string
}

export function calculateImpactScore(
  sleepHours: number,
  stressLevel: number,
  screenTimeHours: number,
  exerciseMinutes: number,
  moodLevel: number
): Result {
  let score = 50 // Base score

  // Sleep impact (optimal: 7-9 hours)
  if (sleepHours >= 7 && sleepHours <= 9) {
    score += 15
  } else if (sleepHours >= 6 && sleepHours < 7) {
    score += 5
  } else if (sleepHours > 9 && sleepHours <= 10) {
    score += 10
  } else {
    score -= 20
  }

  // Stress impact (lower is better, scale 1-5)
  const stressScore = (5 - stressLevel) * 4
  score += stressScore

  // Screen time impact (lower is better)
  if (screenTimeHours <= 4) {
    score += 15
  } else if (screenTimeHours <= 6) {
    score += 5
  } else if (screenTimeHours <= 8) {
    score -= 5
  } else {
    score -= 15
  }

  // Exercise impact (optimal: 30-60 minutes)
  if (exerciseMinutes >= 30 && exerciseMinutes <= 60) {
    score += 15
  } else if (exerciseMinutes >= 15 && exerciseMinutes < 30) {
    score += 5
  } else if (exerciseMinutes > 60 && exerciseMinutes <= 90) {
    score += 10
  } else if (exerciseMinutes > 90) {
    score += 5
  } else {
    score -= 10
  }

  // Mood impact (higher is better, scale 1-5)
  const moodScore = (moodLevel - 3) * 4
  score += moodScore

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score))

  // Determine category
  let category: 'Low' | 'Moderate' | 'High'
  if (score >= 70) {
    category = 'High'
  } else if (score >= 40) {
    category = 'Moderate'
  } else {
    category = 'Low'
  }

  // Generate explanation
  let explanation = ''
  if (category === 'High') {
    explanation = 'Your daily habits show excellent biological alignment. You\'re maintaining optimal sleep, managing stress well, and staying active. Keep up the great work!'
  } else if (category === 'Moderate') {
    explanation = 'Your biological impact is in a moderate range. There\'s room for improvement in some areas. Consider adjusting sleep patterns, reducing screen time, or increasing physical activity.'
  } else {
    explanation = 'Your biological impact score indicates areas that need attention. Focus on improving sleep quality, reducing stress, limiting screen time, and incorporating regular exercise.'
  }

  // Determine persona
  let persona = ''
  if (score >= 80) {
    persona = 'Optimal Optimizer'
  } else if (score >= 60) {
    persona = 'Balanced Builder'
  } else if (score >= 40) {
    persona = 'Progress Seeker'
  } else {
    persona = 'Transformation Catalyst'
  }

  return { score, category, explanation, persona }
}

