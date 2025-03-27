"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User, TaskType } from "@/types"
import { DonutChart } from "@/components/donut-chart"
import { getTaskTypeColor } from "@/lib/utils"
import { motion } from "motion/react"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface TaskBreakdownProps {
  user: User
}

export function TaskBreakdown({ user }: TaskBreakdownProps) {
  const [activeTab, setActiveTab] = useState<"all" | TaskType>("all")
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  // Count tasks by type and completion status
  const taskCounts = {
    LOW: { total: 0, completed: 0 },
    MID: { total: 0, completed: 0 },
    HIGH: { total: 0, completed: 0 },
  }

  user.tasks.forEach((task) => {
    const type = task.type as TaskType
    taskCounts[type].total++

    // If the task has subtasks, use the subtask completion ratio
    if (task.subTasks && task.subTasks.length > 0) {
      const completedSubtasks = task.subTasks.filter((subTask) => subTask.completed).length
      const completionRatio = completedSubtasks / task.subTasks.length

      // Add partial completion based on subtask ratio
      taskCounts[type].completed += completionRatio
    } else if (task.completed) {
      // Otherwise use the task's own completion status
      taskCounts[type].completed++
    }
  })

  // Prepare data for the charts
  const allTasksData = [
    { name: "Low Tasks", value: taskCounts.LOW.completed, color: getTaskTypeColor("LOW") },
    { name: "Mid Tasks", value: taskCounts.MID.completed, color: getTaskTypeColor("MID") },
    { name: "High Tasks", value: taskCounts.HIGH.completed, color: getTaskTypeColor("HIGH") },
  ]

  const getTypeData = (type: TaskType) => [
    { name: "Completed", value: taskCounts[type].completed, color: getTaskTypeColor(type) },
    { name: "Incomplete", value: taskCounts[type].total - taskCounts[type].completed, color: "#e5e7eb" },
  ]

  const handleSegmentClick = (segment: { name: string; value: number; color: string }) => {
    setSelectedSegment(segment.name)

    // Reset after animation
    setTimeout(() => {
      setSelectedSegment(null)
    }, 2000)
  }

  // Get stats for the selected segment
  const getSegmentStats = () => {
    if (!selectedSegment) return null

    if (activeTab === "all") {
      if (selectedSegment === "Low Tasks") {
        return {
          title: "Low Priority Tasks",
          stats: [
            {
              icon: CheckCircle,
              label: "Completion Rate",
              value: `${((taskCounts.LOW.completed / taskCounts.LOW.total) * 100).toFixed(1)}%`,
            },
            { icon: Clock, label: "Average Duration", value: "2.5 hours" },
            { icon: AlertCircle, label: "Overdue", value: "2 tasks" },
          ],
        }
      } else if (selectedSegment === "Mid Tasks") {
        return {
          title: "Medium Priority Tasks",
          stats: [
            {
              icon: CheckCircle,
              label: "Completion Rate",
              value: `${((taskCounts.MID.completed / taskCounts.MID.total) * 100).toFixed(1)}%`,
            },
            { icon: Clock, label: "Average Duration", value: "4.2 hours" },
            { icon: AlertCircle, label: "Overdue", value: "3 tasks" },
          ],
        }
      } else {
        return {
          title: "High Priority Tasks",
          stats: [
            {
              icon: CheckCircle,
              label: "Completion Rate",
              value: `${((taskCounts.HIGH.completed / taskCounts.HIGH.total) * 100).toFixed(1)}%`,
            },
            { icon: Clock, label: "Average Duration", value: "8.7 hours" },
            { icon: AlertCircle, label: "Overdue", value: "1 task" },
          ],
        }
      }
    } else {
      return {
        title: `${activeTab} Priority Tasks`,
        stats: [
          {
            icon: CheckCircle,
            label: "Completion Rate",
            value: `${((taskCounts[activeTab].completed / taskCounts[activeTab].total) * 100).toFixed(1)}%`,
          },
          { icon: Clock, label: "Total Tasks", value: taskCounts[activeTab].total.toString() },
          { icon: AlertCircle, label: "Completed", value: Math.round(taskCounts[activeTab].completed).toString() },
        ],
      }
    }
  }

  const segmentStats = getSegmentStats()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Task Breakdown</h3>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="LOW">Low Tasks</TabsTrigger>
          <TabsTrigger value="MID">Mid Tasks</TabsTrigger>
          <TabsTrigger value="HIGH">High Tasks</TabsTrigger>
        </TabsList>

        <div className="relative">
          <TabsContent value="all" className="h-[300px]">
            <DonutChart data={allTasksData} onSegmentClick={handleSegmentClick} />
          </TabsContent>

          <TabsContent value="LOW" className="h-[300px]">
            <DonutChart data={getTypeData("LOW")} onSegmentClick={handleSegmentClick} />
          </TabsContent>

          <TabsContent value="MID" className="h-[300px]">
            <DonutChart data={getTypeData("MID")} onSegmentClick={handleSegmentClick} />
          </TabsContent>

          <TabsContent value="HIGH" className="h-[300px]">
            <DonutChart data={getTypeData("HIGH")} onSegmentClick={handleSegmentClick} />
          </TabsContent>

          {segmentStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 rounded-lg border"
            >
              <h4 className="font-medium mb-2">{segmentStats.title}</h4>
              <div className="grid grid-cols-3 gap-4">
                {segmentStats.stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <stat.icon className="h-5 w-5 mb-1 text-primary" />
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="font-medium">{stat.value}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </Tabs>
    </div>
  )
}

