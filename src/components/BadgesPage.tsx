import { UserData, BADGES } from '../gamification'

interface BadgesPageProps {
  userData: UserData
  onClose: () => void
}

export function BadgesPage({ userData, onClose }: BadgesPageProps) {
  const allBadges = Object.values(BADGES)

  return (
    <div className="badges-page-overlay" onClick={onClose}>
      <div className="badges-page card" onClick={(e) => e.stopPropagation()}>
        <div className="badges-page-header">
          <h2 className="section-title">Badges</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="badges-grid">
          {allBadges.map((badge) => {
            const isUnlocked = userData.badgesUnlocked.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`badge-item ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="badge-icon-large">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
                {isUnlocked && <div className="badge-checkmark">✓</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

