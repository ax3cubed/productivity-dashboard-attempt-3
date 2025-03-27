"use client"

import type { User } from "@/types"
import { calculateRTP } from "@/lib/calculate-rtp"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart, Calendar, Clock, CheckCircle } from "lucide-react"
import { motion } from "motion/react"
import { useState, useEffect } from "react"

interface ProductivityMetricsProps {
  user: User
}

export function ProductivityMetrics({ user }: ProductivityMetricsProps) {
  // Calculate RTP with enhanced metrics
  const overallRTP = calculateRTP(user)
  const lowRTP = calculateRTP(user, "LOW")
  const midRTP = calculateRTP(user, "MID")
  const highRTP = calculateRTP(user, "HIGH")

  // Animation states
  const [activeTab, setActiveTab] = useState("overall")
  const [animatedValues, setAnimatedValues] = useState({
    overall: 0,
    completion: 0,
    estimation: 0,
    low: 0,
    mid: 0,
    high: 0,
  })

  // Get today's date for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Calculate today's metrics
  const todayRTP = calculateRTP(user, undefined, { start: today, end: tomorrow })

  // Animate values when they change
  useEffect(() => {
    const duration = 1000 // ms
    const interval = 20 // update every 20ms
    const steps = duration / interval

    const overallStep = overallRTP.percentage / steps
    const completionStep = overallRTP.metrics.completionRate / steps
    const estimationStep = (overallRTP.metrics.estimationAccuracy || 0) / steps
    const lowStep = lowRTP.percentage / steps
    const midStep = midRTP.percentage / steps
    const highStep = highRTP.percentage / steps

    let current = {
      overall: 0,
      completion: 0,
      estimation: 0,
      low: 0,
      mid: 0,
      high: 0,
    }

    const timer = setInterval(() => {
      current = {
        overall: Math.min(current.overall + overallStep, overallRTP.percentage),
        completion: Math.min(current.completion + completionStep, overallRTP.metrics.completionRate),
        estimation: Math.min(current.estimation + estimationStep, overallRTP.metrics.estimationAccuracy || 0),
        low: Math.min(current.low + lowStep, lowRTP.percentage),
        mid: Math.min(current.mid + midStep, midRTP.percentage),
        high: Math.min(current.high + highStep, highRTP.percentage),
      }

      setAnimatedValues(current)

      if (
        current.overall >= overallRTP.percentage &&
        current.completion >= overallRTP.metrics.completionRate &&
        current.estimation >= (overallRTP.metrics.estimationAccuracy || 0) &&
        current.low >= lowRTP.percentage &&
        current.mid >= midRTP.percentage &&
        current.high >= highRTP.percentage
      ) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [
    overallRTP.percentage,
    overallRTP.metrics.completionRate,
    overallRTP.metrics.estimationAccuracy,
    lowRTP.percentage,
    midRTP.percentage,
    highRTP.percentage,
  ])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Productivity Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall RTP</span>
                <span className="font-medium">{animatedValues.overall.toFixed(1)}%</span>
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ originX: 0 }}
              >
                <Progress value={animatedValues.overall} className="bg-primary/20" />
              </motion.div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score: {overallRTP.score} points</span>
                <span className="text-muted-foreground">Completion Rate: {animatedValues.completion.toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Task Completion</span>
                </div>
                <p className="text-2xl font-bold">{animatedValues.completion.toFixed(1)}%</p>
              </motion.div>

              <motion.div
                className="space-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Estimation Accuracy</span>
                </div>
                <p className="text-2xl font-bold">
                  {overallRTP.metrics.estimationAccuracy !== null ? `${animatedValues.estimation.toFixed(1)}%` : "N/A"}
                </p>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today's RTP</span>
                <span className="font-medium">{todayRTP.percentage.toFixed(1)}%</span>
              </div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ originX: 0 }}
              >
                <Progress value={todayRTP.percentage} className="bg-primary/20" />
              </motion.div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score: {todayRTP.score} points</span>
                <span className="text-muted-foreground">
                  Completion Rate: {todayRTP.metrics.completionRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <motion.div
              className="flex items-center justify-center p-4 border rounded-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </motion.div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-500 font-medium">Low Priority</span>
                  <span className="font-medium">{animatedValues.low.toFixed(1)}%</span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: activeTab === "detailed" ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ originX: 0 }}
                >
                  <Progress value={animatedValues.low} className="bg-blue-100 text-blue-500" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-500 font-medium">Medium Priority</span>
                  <span className="font-medium">{animatedValues.mid.toFixed(1)}%</span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: activeTab === "detailed" ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  style={{ originX: 0 }}
                >
                  <Progress value={animatedValues.mid} className="bg-purple-100 text-purple-500" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-500 font-medium">High Priority</span>
                  <span className="font-medium">{animatedValues.high.toFixed(1)}%</span>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: activeTab === "detailed" ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                  style={{ originX: 0 }}
                >
                  <Progress value={animatedValues.high} className="bg-orange-100 text-orange-500" />
                </motion.div>
              </div>
            </div>

            <motion.div
              className="flex items-center justify-center p-2 border rounded-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Average Task Weight: {overallRTP.metrics.averageTaskWeight.toFixed(1)}
              </span>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

