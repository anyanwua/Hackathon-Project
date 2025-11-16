import { useEffect, useState } from 'react'

interface XPPopupProps {
  amount: number
  reason: string
  onComplete: () => void
}

export function XPPopup({ amount, reason, onComplete }: XPPopupProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 300)
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div className={`xp-popup ${visible ? 'show' : ''}`}>
      <div className="xp-popup-content">
        <div className="xp-amount">+{amount} XP</div>
        <div className="xp-reason">{reason}</div>
      </div>
    </div>
  )
}

