"use client"

import { useState, useMemo, useEffect } from "react"
import type { User, TaskType } from "@/types"
import { UserSelector } from "@/components/user-selector"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calculateRTP } from "@/lib/calculate-rtp"
import { LineChart } from "@/components/line-chart"
import { getTaskTypeColor } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ProductivityTrendsProps {
  users: User[]
}

// Add a TimeScale type
type TimeScale = "day" | "week" | "month" | "year"

export function ProductivityTrends({ users }: ProductivityTrendsProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userList, setUserList] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<"all" | "aggregate" | TaskType>("all")
  const [timeScale, setTimeScale] = useState<TimeScale>("month")

// Load initial users
useEffect(() => {
  const loadUsers = async () => {
    try {
      const userList = await users
       setUserList(userList);
      setSelectedUser(userList[0])
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  loadUsers()
}, [users])
  // Prevent rendering if no user is selected
  // Group tasks by the selected time scale
  const timeScaledData = useMemo(() => {
    const timeGroups: Record<string, User> = {}
  
    selectedUser?.tasks.forEach((task) => {
      const taskDate = new Date(task.startDateTime)
      let timeKey: string

      // Generate the appropriate time key based on selected scale
      switch (timeScale) {
        case "day":
          timeKey = taskDate.toISOString().split("T")[0] // YYYY-MM-DD
          break
        case "week":
          // Get the week number and year
          const weekNum = getWeekNumber(taskDate)
          timeKey = `${taskDate.getFullYear()}-W${weekNum}`
          break
        case "year":
          timeKey = `${taskDate.getFullYear()}`
          break
        case "month":
        default:
          // Default to month view
          timeKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, "0")}`
          break
      }

      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = {
          name: selectedUser.name,
          tasks: [],
        }
      }

      timeGroups[timeKey].tasks.push(task)
    })

    // Sort time periods chronologically
    return Object.entries(timeGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timePeriod, data]) => {
        // Format the display name based on time scale
        let displayName: string

        switch (timeScale) {
          case "day":
            displayName = new Date(timePeriod).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
            break
          case "week":
            const [year, week] = timePeriod.split("-W")
            displayName = `Week ${week}, ${year}`
            break
          case "year":
            displayName = timePeriod
            break
          case "month":
          default:
            const [yearPart, monthNum] = timePeriod.split("-")
            const monthName = new Date(Number.parseInt(yearPart), Number.parseInt(monthNum) - 1).toLocaleString(
              "default",
              {
                month: "short",
              },
            )
            displayName = `${monthName} ${yearPart}`
            break
        }

        const rtpAll = calculateRTP(data)
        const rtpLow = calculateRTP(data, "LOW")
        const rtpMid = calculateRTP(data, "MID")
        const rtpHigh = calculateRTP(data, "HIGH")

        return {
          period: displayName,
          all: rtpAll.percentage,
          low: rtpLow.percentage,
          mid: rtpMid.percentage,
          high: rtpHigh.percentage,
          // Calculate aggregate as the average of all task types
          aggregate: (rtpLow.percentage + rtpMid.percentage + rtpHigh.percentage) / 3,
          allScore: rtpAll.score,
          lowScore: rtpLow.score,
          midScore: rtpMid.score,
          highScore: rtpHigh.score,
          // Calculate aggregate score as the sum of all scores
          aggregateScore: rtpLow.score + rtpMid.score + rtpHigh.score,
        }
      })
  }, [selectedUser, timeScale])

  // Prepare chart data based on active tab
  const chartData = useMemo(() => {
    if (activeTab === "all") {
      return [
        {
          name: "Overall RTP",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.all })),
          color: "#6366f1", // indigo-500
        },
        {
          name: "Low Tasks",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.low })),
          color: getTaskTypeColor("LOW"),
        },
        {
          name: "Mid Tasks",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.mid })),
          color: getTaskTypeColor("MID"),
        },
        {
          name: "High Tasks",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.high })),
          color: getTaskTypeColor("HIGH"),
        },
      ]
    } else if (activeTab === "aggregate") {
      return [
        {
          name: "Aggregate RTP",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.aggregate })),
          color: "#10b981", // emerald-500
        },
      ]
    } else if (activeTab === "LOW") {
      return [
        {
          name: "Low Tasks",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.low })),
          color: getTaskTypeColor("LOW"),
        },
      ]
    } else if (activeTab === "MID") {
      return [
        {
          name: "Mid Tasks",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.mid })),
          color: getTaskTypeColor("MID"),
        },
      ]
    } else {
      return [
        {
          name: "High Tasks",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.high })),
          color: getTaskTypeColor("HIGH"),
        },
      ]
    }
  }, [activeTab, timeScaledData])

  // Prepare score chart data
  const scoreChartData = useMemo(() => {
    if (activeTab === "all") {
      return [
        {
          name: "Overall Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.allScore })),
          color: "#6366f1", // indigo-500
        },
        {
          name: "Low Tasks Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.lowScore })),
          color: getTaskTypeColor("LOW"),
        },
        {
          name: "Mid Tasks Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.midScore })),
          color: getTaskTypeColor("MID"),
        },
        {
          name: "High Tasks Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.highScore })),
          color: getTaskTypeColor("HIGH"),
        },
      ]
    } else if (activeTab === "aggregate") {
      return [
        {
          name: "Aggregate Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.aggregateScore })),
          color: "#10b981", // emerald-500
        },
      ]
    } else if (activeTab === "LOW") {
      return [
        {
          name: "Low Tasks Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.lowScore })),
          color: getTaskTypeColor("LOW"),
        },
      ]
    } else if (activeTab === "MID") {
      return [
        {
          name: "Mid Tasks Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.midScore })),
          color: getTaskTypeColor("MID"),
        },
      ]
    } else {
      return [
        {
          name: "High Tasks Score",
          data: timeScaledData.map((m) => ({ x: m.period, y: m.highScore })),
          color: getTaskTypeColor("HIGH"),
        },
      ]
    }
  }, [activeTab, timeScaledData])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <UserSelector users={userList} selectedUser={selectedUser ?? undefined} onSelectUser={setSelectedUser} />

        <ToggleGroup
          type="single"
          value={timeScale}
          onValueChange={(value) => value && setTimeScale(value as TimeScale)}
        >
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
          <ToggleGroupItem value="year">Year</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="aggregate">Aggregate</TabsTrigger>
          <TabsTrigger value="LOW">Low Tasks</TabsTrigger>
          <TabsTrigger value="MID">Mid Tasks</TabsTrigger>
          <TabsTrigger value="HIGH">High Tasks</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Productivity Percentage Over Time
            </h3>
            <div className="h-[400px]">
              <LineChart data={chartData} yAxisLabel="Productivity (%)" yMax={100} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Productivity Score Over Time
            </h3>
            <div className="h-[400px]">
              <LineChart data={scoreChartData} yAxisLabel="Score" />
            </div>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

