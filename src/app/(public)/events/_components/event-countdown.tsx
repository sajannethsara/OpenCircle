"use client"

import * as React from "react"
import { Clock } from "lucide-react"

interface EventCountdownProps {
  targetDate: string
}

export function EventCountdown({ targetDate }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    isPast: boolean
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false })

  React.useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDate).getTime()
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0 || isNaN(target)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isPast: false })
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (timeLeft.isPast) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
        Starting Soon
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
      <Clock className="h-3.5 w-3.5 animate-pulse text-red-500 shrink-0" />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  )
}
