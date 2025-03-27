"use client"

import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { useEffect, useState } from "react"

interface ProductivityScoreProps {
  label: string
  percentage: number
  score: number
  className?: string
}

export function ProductivityScore({ label, percentage, score, className }: ProductivityScoreProps) {
  const [displayPercentage, setDisplayPercentage] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)

  // Animate the numbers on mount and when they change
  useEffect(() => {
    const duration = 1000 // ms
    const percentageInterval = 20 // update every 20ms
    const scoreInterval = 30 // update every 30ms

    const percentageStep = percentage / (duration / percentageInterval)
    const scoreStep = score / (duration / scoreInterval)

    let currentPercentage = 0
    let currentScore = 0

    const percentageTimer = setInterval(() => {
      currentPercentage += percentageStep
      if (currentPercentage >= percentage) {
        currentPercentage = percentage
        clearInterval(percentageTimer)
      }
      setDisplayPercentage(Math.round(currentPercentage * 10) / 10)
    }, percentageInterval)

    const scoreTimer = setInterval(() => {
      currentScore += scoreStep
      if (currentScore >= score) {
        currentScore = score
        clearInterval(scoreTimer)
      }
      setDisplayScore(Math.round(currentScore))
    }, scoreInterval)

    return () => {
      clearInterval(percentageTimer)
      clearInterval(scoreTimer)
    }
  }, [percentage, score])

  return (
    <motion.div
      className={cn("rounded-lg p-6 shadow-sm", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2 },
      }}
    >
      <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</h3>
      <div className="flex flex-col gap-1">
        <div className="flex items-end gap-2">
          <motion.span
            className="text-4xl font-bold text-gray-900 dark:text-white"
            key={displayPercentage} // Force re-render on change
            initial={{ opacity: 0.5, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {displayPercentage.toFixed(1)}%
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Score:{" "}
            <motion.span
              className="font-medium"
              key={displayScore} // Force re-render on change
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {displayScore}
            </motion.span>{" "}
            points
          </span>
        </div>
      </div>
    </motion.div>
  )
}

