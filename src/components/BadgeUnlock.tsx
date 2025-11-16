import { useEffect, useState } from 'react'
import { BADGES, type Badge } from '../gamification'

interface BadgeUnlockProps {
  badgeId: string
  onComplete: () => void
}

export function BadgeUnlock({ badgeId, onComplete }: BadgeUnlockProps) {
  const [visible, setVisible] = useState(true)
  const badge: Badge | undefined = BADGES[badgeId]

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible || !badge) return null

  return (
    <div className={`badge-unlock-popup ${visible ? 'show' : ''}`}>
      <div className="badge-unlock-content">
        <div className="badge-unlock-icon">{badge.icon}</div>
        <div className="badge-unlock-title">Badge Unlocked!</div>
        <div className="badge-unlock-name">{badge.name}</div>
        <div className="badge-unlock-description">{badge.description}</div>
      </div>
    </div>
  )
}

