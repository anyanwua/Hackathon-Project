export interface Result {
  score: number
  category: 'Low' | 'Moderate' | 'High'
  message: string
}

export function calculateImpactScore(
  sleepHours: number,
  stressLevel: number,
  screenTimeHours: number,
  exerciseMinutes: number,
  moodLevel: number
): Result {
  // Step 1: Compute penalty values (0-1) based on deviation from healthy ranges
  const sleepPenalty = Math.max(0, Math.abs(sleepHours - 8) / 8)
  const stressPenalty = (stressLevel - 1) / 4
  const screenPenalty = Math.max(0, (screenTimeHours - 4) / 8)
  const exercisePenalty = Math.max(0, (30 - exerciseMinutes) / 60)
  const moodPenalty = (5 - moodLevel) / 4

  // Step 2: Weighted sum
  const raw =
    0.30 * sleepPenalty +
    0.25 * stressPenalty +
    0.20 * screenPenalty +
    0.15 * exercisePenalty +
    0.10 * moodPenalty

  // Step 3: Convert to 0-100
  const score = Math.max(0, Math.min(100, Math.round(raw * 100)))

  // Step 4: Category rules
  let category: 'Low' | 'Moderate' | 'High'
  if (score <= 33) {
    category = 'Low'
  } else if (score >= 34 && score <= 66) {
    category = 'Moderate'
  } else {
    category = 'High'
  }

  // Step 5: Generate message explaining stress, sleep, and lifestyle impact
  let message = ''
  
  if (category === 'High') {
    if (sleepPenalty < 0.25 && stressPenalty < 0.5 && screenPenalty < 0.5) {
      message = 'Your biological impact score reflects excellent lifestyle balance. Your sleep patterns are optimal, stress levels are well-managed, and screen time is within healthy limits. Continue maintaining these positive habits for sustained wellness.'
    } else if (sleepPenalty >= 0.5) {
      message = 'Your biological impact score is high, but sleep quality needs attention. While your stress management and lifestyle choices are contributing positively, improving sleep duration and consistency will further enhance your overall biological health.'
    } else if (stressPenalty >= 0.75) {
      message = 'Your biological impact score is high, though stress management could be improved. Your sleep and lifestyle habits are solid, but reducing stress through mindfulness or relaxation techniques would optimize your biological wellness.'
    } else {
      message = 'Your biological impact score is high, indicating strong overall wellness. Your sleep and stress management are on track, and your lifestyle choices support good biological health. Keep up the excellent work!'
    }
  } else if (category === 'Moderate') {
    if (sleepPenalty >= 0.5 && stressPenalty >= 0.5) {
      message = 'Your biological impact score is moderate, with both sleep and stress areas needing improvement. Focus on establishing a consistent sleep schedule of 7-9 hours and implementing stress-reduction strategies. These changes will significantly improve your biological wellness.'
    } else if (sleepPenalty >= 0.5) {
      message = 'Your biological impact score is moderate, primarily due to sleep patterns that deviate from the optimal 8-hour range. Your stress management and lifestyle choices are reasonable, but improving sleep quality and duration would boost your biological health.'
    } else if (stressPenalty >= 0.5) {
      message = 'Your biological impact score is moderate, with elevated stress levels being a key factor. Your sleep patterns are decent, but implementing stress management techniques such as meditation, exercise, or time management would improve your overall biological wellness.'
    } else if (screenPenalty >= 0.5 || exercisePenalty >= 0.5) {
      message = 'Your biological impact score is moderate, with lifestyle factors like screen time or exercise levels affecting your wellness. Your sleep and stress management are adequate, but balancing screen usage and increasing physical activity would enhance your biological health.'
    } else {
      message = 'Your biological impact score is moderate, indicating a balanced but improvable wellness profile. Your sleep, stress, and lifestyle habits are within acceptable ranges, but optimizing each area would move you toward better biological health.'
    }
  } else {
    // Low category
    if (sleepPenalty >= 0.75 && stressPenalty >= 0.75) {
      message = 'Your biological impact score is low, with both sleep and stress requiring immediate attention. Prioritize establishing a regular sleep schedule of 7-9 hours and implementing daily stress-reduction practices. These fundamental changes are crucial for improving your biological wellness.'
    } else if (sleepPenalty >= 0.75) {
      message = 'Your biological impact score is low, primarily due to significant sleep disruption. Aim for 7-9 hours of consistent sleep nightly, as this is foundational to biological health. While stress and lifestyle factors also need attention, sleep improvement should be your top priority.'
    } else if (stressPenalty >= 0.75) {
      message = 'Your biological impact score is low, with high stress levels significantly impacting your biological wellness. Implement stress management strategies immediately—consider meditation, regular exercise, or professional support. Your sleep patterns also need attention to support stress recovery.'
    } else {
      message = 'Your biological impact score is low, indicating multiple areas need improvement. Focus on establishing healthy sleep patterns (7-9 hours), reducing stress through proven techniques, and balancing screen time with physical activity. These lifestyle changes will significantly improve your biological health.'
    }
  }

  return { score, category, message }
}
