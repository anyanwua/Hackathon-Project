import { useState, useEffect } from 'react'
import { calculateImpactScore, type Result } from './scoring'
import { 
  getUserData, 
  saveUserData, 
  addXP, 
  updateStreak, 
  updateLoginStreak, 
  unlockBadge, 
  checkBadgeConditions,
  type UserData 
} from './gamification'
import { GamificationDashboard } from './components/GamificationDashboard'
import { XPPopup } from './components/XPPopup'
import { BadgeUnlock } from './components/BadgeUnlock'
import { BadgesPage } from './components/BadgesPage'

interface FormData {
  sleepHours: number
  stressLevel: number
  screenTimeHours: number
  exerciseMinutes: number
  moodLevel: number
}

interface XPGain {
  amount: number
  reason: string
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    sleepHours: 8,
    stressLevel: 3,
    screenTimeHours: 6,
    exerciseMinutes: 30,
    moodLevel: 3
  })
  const [result, setResult] = useState<Result | null>(null)
  const [simulatedSleepHours, setSimulatedSleepHours] = useState<number>(8)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [userData, setUserData] = useState<UserData>(getUserData())
  const [xpGain, setXPGain] = useState<XPGain | null>(null)
  const [badgeUnlock, setBadgeUnlock] = useState<string | null>(null)
  const [showBadgesPage, setShowBadgesPage] = useState(false)
  const [levelUp, setLevelUp] = useState<number | null>(null)

  // Initialize user data and check login streak on mount
  useEffect(() => {
    const initialData = getUserData()
    const loginUpdate = updateLoginStreak(initialData)
    setUserData(loginUpdate.newData)
    if (loginUpdate.loginStreakXP > 0) {
      const xpResult = addXP(loginUpdate.loginStreakXP, 'Daily Login', loginUpdate.newData)
      setUserData(xpResult.newData)
      if (xpResult.leveledUp && xpResult.newLevel) {
        setLevelUp(xpResult.newLevel)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const calculatedResult = calculateImpactScore(
      formData.sleepHours,
      formData.stressLevel,
      formData.screenTimeHours,
      formData.exerciseMinutes,
      formData.moodLevel
    )
    setResult(calculatedResult)
    setSimulatedSleepHours(formData.sleepHours)
    setIsAnalysisOpen(true)

    // Gamification logic
    let currentUserData = { ...userData }
    const xpGains: XPGain[] = []
    let finalLevelUp: number | null = null

    // Update login streak
    const loginUpdate = updateLoginStreak(currentUserData)
    currentUserData = loginUpdate.newData
    if (loginUpdate.loginStreakXP > 0) {
      const loginXPResult = addXP(loginUpdate.loginStreakXP, 'Daily Login', currentUserData)
      currentUserData = loginXPResult.newData
      xpGains.push({ amount: loginUpdate.loginStreakXP, reason: 'Daily Login' })
      if (loginXPResult.leveledUp && loginXPResult.newLevel) {
        finalLevelUp = loginXPResult.newLevel
      }
    }

    // Update task completion streak
    const streakUpdate = updateStreak(currentUserData)
    currentUserData = streakUpdate.newData
    if (streakUpdate.streakXP > 0) {
      const streakXPResult = addXP(streakUpdate.streakXP, `${currentUserData.currentStreak}-Day Streak!`, currentUserData)
      currentUserData = streakXPResult.newData
      xpGains.push({ amount: streakUpdate.streakXP, reason: `${currentUserData.currentStreak}-Day Streak!` })
      if (streakXPResult.leveledUp && streakXPResult.newLevel) {
        finalLevelUp = streakXPResult.newLevel
      }
    }

    // Mark daily tasks as completed
    currentUserData.dailyTasksCompleted = true
    saveUserData(currentUserData)

    // Award XP for completing all daily inputs
    const dailyTasksXP = addXP(10, 'Daily Tasks Completed', currentUserData)
    currentUserData = dailyTasksXP.newData
    xpGains.push({ amount: 10, reason: 'Daily Tasks Completed' })
    if (dailyTasksXP.leveledUp && dailyTasksXP.newLevel) {
      finalLevelUp = dailyTasksXP.newLevel
    }

    // Award XP for completing recommended tasks (from analysis)
    // For now, we'll award this if the score is in a good range
    if (calculatedResult.score >= 40) {
      const recommendedXP = addXP(20, 'Completed Recommended Tasks', currentUserData)
      currentUserData = recommendedXP.newData
      xpGains.push({ amount: 20, reason: 'Completed Recommended Tasks' })
      if (recommendedXP.leveledUp && recommendedXP.newLevel) {
        finalLevelUp = recommendedXP.newLevel
      }
    }
    
    // Set level up if any occurred (finalLevelUp will be the most recent/highest)
    if (finalLevelUp) {
      setLevelUp(finalLevelUp)
    }

    // Check and unlock badges
    const newBadges = checkBadgeConditions(currentUserData)
    const unlockedBadgeIds: string[] = []
    newBadges.forEach((badgeId) => {
      const badgeResult = unlockBadge(badgeId, currentUserData)
      currentUserData = badgeResult.newData
      if (badgeResult.unlocked) {
        unlockedBadgeIds.push(badgeId)
      }
    })

    setUserData(currentUserData)

    // Show XP popups sequentially, then show badge unlocks
    const showNextXP = (index: number) => {
      if (index < xpGains.length) {
        setXPGain(xpGains[index])
        setTimeout(() => {
          setXPGain(null)
          if (index < xpGains.length - 1) {
            setTimeout(() => showNextXP(index + 1), 300)
          } else {
            // All XP shown, now show badges
            if (unlockedBadgeIds.length > 0) {
              setTimeout(() => {
                setBadgeUnlock(unlockedBadgeIds[0])
                // If multiple badges, show them sequentially
                if (unlockedBadgeIds.length > 1) {
                  let badgeIndex = 1
                  const showNextBadge = () => {
                    if (badgeIndex < unlockedBadgeIds.length) {
                      setTimeout(() => {
                        setBadgeUnlock(unlockedBadgeIds[badgeIndex])
                        badgeIndex++
                        if (badgeIndex < unlockedBadgeIds.length) {
                          setTimeout(showNextBadge, 3500)
                        }
                      }, 3500)
                    }
                  }
                  setTimeout(showNextBadge, 3500)
                }
              }, 500)
            }
          }
        }, 2000)
      }
    }

    if (xpGains.length > 0) {
      showNextXP(0)
    } else if (unlockedBadgeIds.length > 0) {
      // No XP but there are badges
      setBadgeUnlock(unlockedBadgeIds[0])
      if (unlockedBadgeIds.length > 1) {
        let badgeIndex = 1
        const showNextBadge = () => {
          if (badgeIndex < unlockedBadgeIds.length) {
            setTimeout(() => {
              setBadgeUnlock(unlockedBadgeIds[badgeIndex])
              badgeIndex++
              if (badgeIndex < unlockedBadgeIds.length) {
                setTimeout(showNextBadge, 3500)
              }
            }, 3500)
          }
        }
        setTimeout(showNextBadge, 3500)
      }
    }
  }

  const handleChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Get slider color based on sleep hours
  const getSliderColor = (hours: number) => {
    if (hours <= 4) return '#ef4444' // red
    if (hours <= 5) return '#f59e0b' // orange
    if (hours <= 6) return '#eab308' // yellow
    if (hours <= 7) return '#84cc16' // lime
    if (hours <= 9) return '#22c55e' // green
    return '#16a34a' // dark green
  }

  // Calculate slider thumb position for bubble
  const getSliderThumbPosition = (value: number) => {
    const min = 3
    const max = 10
    const percentage = ((value - min) / (max - min)) * 100
    return percentage
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-purple-600 via-pink-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            MindGene OS
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-normal">
            See how your habits shape your biology.
          </p>
        </div>

        {/* Gamification Dashboard */}
        <GamificationDashboard 
          userData={userData} 
          onViewBadges={() => setShowBadgesPage(true)}
        />

        {/* Daily Check-In Card */}
        <div className="card">
          <h2 className="section-title">Daily Check-In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sleep Hours */}
            <div className="form-field">
              <label htmlFor="sleepHours" className="form-label">
                <span className="form-icon">💤</span>
                <span>Sleep Hours</span>
              </label>
              <input
                id="sleepHours"
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={formData.sleepHours}
                onChange={(e) => handleChange('sleepHours', parseFloat(e.target.value) || 0)}
                className="form-input"
                required
              />
            </div>

            <div className="divider"></div>

            {/* Stress Level */}
            <div className="form-field">
              <label htmlFor="stressLevel" className="form-label">
                <span className="form-icon">😥</span>
                <span>Stress Level</span>
              </label>
              <select
                id="stressLevel"
                value={formData.stressLevel}
                onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                className="form-input"
                required
              >
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>

            <div className="divider"></div>

            {/* Screen Time */}
            <div className="form-field">
              <label htmlFor="screenTimeHours" className="form-label">
                <span className="form-icon">📱</span>
                <span>Screen Time Hours</span>
              </label>
              <input
                id="screenTimeHours"
                type="number"
                min="0"
                max="16"
                step="0.5"
                value={formData.screenTimeHours}
                onChange={(e) => handleChange('screenTimeHours', parseFloat(e.target.value) || 0)}
                className="form-input"
                required
              />
            </div>

            <div className="divider"></div>

            {/* Exercise Minutes */}
            <div className="form-field">
              <label htmlFor="exerciseMinutes" className="form-label">
                <span className="form-icon">💪</span>
                <span>Exercise Minutes</span>
              </label>
              <input
                id="exerciseMinutes"
                type="number"
                min="0"
                max="180"
                step="1"
                value={formData.exerciseMinutes}
                onChange={(e) => handleChange('exerciseMinutes', parseInt(e.target.value) || 0)}
                className="form-input"
                required
              />
            </div>

            <div className="divider"></div>

            {/* Mood Level */}
            <div className="form-field">
              <label htmlFor="moodLevel" className="form-label">
                <span className="form-icon">🙂</span>
                <span>Mood Level</span>
              </label>
              <select
                id="moodLevel"
                value={formData.moodLevel}
                onChange={(e) => handleChange('moodLevel', parseInt(e.target.value))}
                className="form-input"
                required
              >
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>

            <button
              type="submit"
              className="submit-button"
            >
              Analyze My Biology
            </button>
          </form>
        </div>

        {/* Biological Analysis Card - Collapsible */}
        {result && (
          <div className={`card analysis-card ${isAnalysisOpen ? 'open' : ''}`}>
            <h2 className="section-title">
              <span className="mr-2">🧬</span>
              Biological Analysis
            </h2>

            {/* Top Summary */}
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Score</div>
                <div className="summary-value">{result.score}/100</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Status</div>
                <div className={`summary-value status-${result.category.toLowerCase()}`}>
                  {result.category}
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Persona</div>
                <div className="summary-value-small">{result.persona}</div>
              </div>
            </div>

            <div className="divider"></div>

            {/* Score Display */}
            <div className="score-display">
              <div className="score-header">
                <span className="score-text">{result.score}/100</span>
                <span className="score-category">– {result.category}</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className={`progress-bar progress-${result.category.toLowerCase()}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            <div className="divider"></div>

            {/* Message */}
            <div className="message-box">
              <p className="message-text">{result.message}</p>
            </div>

            <div className="divider"></div>

            {/* Persona */}
            <div className="persona-section">
              <div className="persona-title">{result.persona}</div>
              <p className="persona-description">{result.personaDescription}</p>
            </div>

            <div className="divider"></div>

            {/* What If Simulation */}
            <div className="simulation-section">
              <h3 className="subsection-title">What If Simulation</h3>
              <p className="subsection-subtitle">What if I change my sleep hours?</p>
              
              <div className="slider-container">
                <div className="slider-wrapper">
                  <div className="slider-ticks">
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
                      <div key={tick} className="slider-tick" style={{ left: `${((tick - 3) / 7) * 100}%` }}>
                        <span className="tick-mark"></span>
                        <span className="tick-label">{tick}h</span>
                      </div>
                    ))}
                  </div>
                  <div className="slider-track-wrapper">
                    <input
                      id="simulatedSleepHours"
                      type="range"
                      min="3"
                      max="10"
                      step="0.5"
                      value={simulatedSleepHours}
                      onChange={(e) => setSimulatedSleepHours(parseFloat(e.target.value))}
                      className="slider-input"
                      style={{
                        '--slider-color': getSliderColor(simulatedSleepHours),
                        '--thumb-position': `${getSliderThumbPosition(simulatedSleepHours)}%`
                      } as React.CSSProperties}
                    />
                    <div
                      className="slider-bubble"
                      style={{
                        left: `${getSliderThumbPosition(simulatedSleepHours)}%`,
                        backgroundColor: getSliderColor(simulatedSleepHours)
                      }}
                    >
                      {simulatedSleepHours}h
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                const simulatedResult = calculateImpactScore(
                  simulatedSleepHours,
                  formData.stressLevel,
                  formData.screenTimeHours,
                  formData.exerciseMinutes,
                  formData.moodLevel
                )
                
                return (
                  <div className="simulation-results">
                    <div className="comparison-grid">
                      <div className="comparison-card">
                        <div className="comparison-label">Current</div>
                        <div className="comparison-score">{result.score}</div>
                        <div className="comparison-detail">({formData.sleepHours}h sleep)</div>
                      </div>
                      <div className="comparison-card">
                        <div className="comparison-label">Simulated</div>
                        <div className={`comparison-score ${
                          simulatedResult.score > result.score ? 'higher' :
                          simulatedResult.score < result.score ? 'lower' :
                          'same'
                        }`}>
                          {simulatedResult.score}
                        </div>
                        <div className="comparison-detail">({simulatedSleepHours}h sleep)</div>
                      </div>
                    </div>
                    <div className="simulation-message">
                      If you slept <strong>{simulatedSleepHours} hours</strong> tonight, your score would change from <strong>{result.score}</strong> to <strong className={simulatedResult.score > result.score ? 'text-red-600' : simulatedResult.score < result.score ? 'text-green-600' : ''}>{simulatedResult.score}</strong>.
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* XP Popup */}
        {xpGain && (
          <XPPopup
            amount={xpGain.amount}
            reason={xpGain.reason}
            onComplete={() => setXPGain(null)}
          />
        )}

        {/* Badge Unlock Popup */}
        {badgeUnlock && (
          <BadgeUnlock
            badgeId={badgeUnlock}
            onComplete={() => setBadgeUnlock(null)}
          />
        )}

        {/* Level Up Popup */}
        {levelUp && (
          <div className="level-up-popup show">
            <div className="level-up-content">
              <div className="level-up-icon">🎉</div>
              <div className="level-up-title">Level Up!</div>
              <div className="level-up-level">Level {levelUp}</div>
              <button onClick={() => setLevelUp(null)} className="level-up-button">Awesome!</button>
            </div>
          </div>
        )}

        {/* Badges Page */}
        {showBadgesPage && (
          <BadgesPage
            userData={userData}
            onClose={() => setShowBadgesPage(false)}
          />
        )}
      </div>
    </div>
  )
}

export default App
