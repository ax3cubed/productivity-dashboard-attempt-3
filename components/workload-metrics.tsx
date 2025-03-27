"use client"

import type { User } from "@/types"
import { calculateWorkloadMetrics } from "@/lib/calculate-rtp"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { motion } from "motion/react"
import { useState, useEffect } from "react"

interface WorkloadMetricsProps {
  user: User
}

export function WorkloadMetrics({ user }: WorkloadMetricsProps) {
  const metrics = calculateWorkloadMetrics(user)
  const [animatedWorkload, setAnimatedWorkload] = useState(0)

  // Animate workload percentage
  useEffect(() => {
    const workloadPercentage = Math.min(100, Math.round(metrics.overloadFactor * 100))
    const duration = 1000 // ms
    const interval = 20 // update every 20ms
    const step = workloadPercentage / (duration / interval)

    let current = 0

    const timer = setInterval(() => {
      current += step
      if (current >= workloadPercentage) {
        current = workloadPercentage
        clearInterval(timer)
      }
      setAnimatedWorkload(Math.round(current))
    }, interval)

    return () => clearInterval(timer)
  }, [metrics.overloadFactor])

  // Calculate color based on overload factor
  const getOverloadColor = () => {
    if (metrics.overloadFactor > 1.5) return "bg-red-500"
    if (metrics.overloadFactor > 1) return "bg-amber-500"
    if (metrics.overloadFactor > 0.7) return "bg-green-500"
    return "bg-blue-500" // Under-utilized
  }

  // Calculate percentage for progress bar
  const workloadPercentage = Math.min(100, Math.round(metrics.overloadFactor * 100))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Workload Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Workload</span>
            <span className="font-medium">
              {metrics.currentLoad} / {metrics.dailyCapacity} tasks
            </span>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ originX: 0 }}
          >
            <Progress value={animatedWorkload} className={getOverloadColor()} />
          </motion.div>

          {metrics.overloadFactor > 1 && (
            <motion.div
              className="flex items-center text-amber-500 text-sm mt-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>You're {Math.round((metrics.overloadFactor - 1) * 100)}% over capacity</span>
            </motion.div>
          )}

          {metrics.overloadFactor <= 0.5 && (
            <motion.div
              className="flex items-center text-blue-500 text-sm mt-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span>You have capacity for more tasks</span>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Upcoming Deadlines</span>
            </div>
            <motion.p
              className="text-2xl font-bold"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              {metrics.upcomingDeadlines}
            </motion.p>
          </motion.div>

          <motion.div
            className="space-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Blocked Tasks</span>
            </div>
            <motion.p
              className="text-2xl font-bold"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {metrics.blockedTasks}
            </motion.p>
          </motion.div>
        </div>

        {metrics.blockedTasks > 0 && (
          <motion.div
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p>
              You have {metrics.blockedTasks} tasks waiting on dependencies. Resolving these could improve your
              productivity.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

