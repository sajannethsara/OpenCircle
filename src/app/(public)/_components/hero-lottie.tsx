"use client"

import * as React from "react"
import { Lottie } from "lottie-react"

export function HeroLottie() {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="relative w-full max-w-[640px] aspect-[16/11] flex items-center justify-center mx-auto">
        <div className="w-full h-full rounded-2xl bg-muted/10 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-[640px] aspect-[16/11] flex items-center justify-center mx-auto">
      <Lottie
        src="/HeroLottie.json"
        loop={true}
        autoplay={true}
        className="w-full h-full object-contain"
      />
    </div>
  )
}
