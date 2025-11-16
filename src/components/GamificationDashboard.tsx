import { UserData, BADGES } from '../gamification'

interface GamificationDashboardProps {
  userData: UserData
  onViewBadges: () => void
}

export function GamificationDashboard({ userData, onViewBadges }: GamificationDashboardProps) {
  const xpProgress = (userData.xp / userData.xpToNextLevel) * 100
  const recentBadges = userData.badgesUnlocked.slice(-3).reverse()

  return (
    <div className="gamification-dashboard card">
      <div className="dashboard-header">
        <h2 className="section-title">Progress</h2>
        <button onClick={onViewBadges} className="badges-button">
          View Badges
        </button>
      </div>

      <div className="dashboard-content">
        {/* Level and XP */}
        <div className="level-section">
          <div className="level-info">
            <div className="level-label">Level {userData.level}</div>
            <div className="xp-info">
              {userData.xp} / {userData.xpToNextLevel} XP
            </div>
          </div>
          <div className="xp-progress-bar">
            <div
              className="xp-progress-fill"
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="streak-section">
          <div className="streak-icon">🔥</div>
          <div className="streak-info">
            <div className="streak-label">Current Streak</div>
            <div className="streak-value">{userData.currentStreak} days</div>
          </div>
        </div>

        {/* Recent Badges */}
        <div className="badges-preview">
          <div className="badges-preview-label">Recent Badges</div>
          <div className="badges-preview-grid">
            {recentBadges.length > 0 ? (
              recentBadges.map((badgeId) => {
                const badge = BADGES[badgeId]
                return badge ? (
                  <div key={badgeId} className="badge-preview-item" title={badge.name}>
                    <span className="badge-preview-icon">{badge.icon}</span>
                  </div>
                ) : null
              })
            ) : (
              <div className="badge-preview-empty">No badges yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

