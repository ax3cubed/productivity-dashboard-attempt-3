"use client"

import { useState, useEffect } from "react"
import { UserSelector } from "@/components/user-selector"
import { ProductivityScore } from "@/components/productivity-score"
import { TaskBreakdown } from "@/components/task-breakdown"
import { TaskList } from "@/components/task-list"
import { AddTaskForm } from "@/components/add-task-form"
import { WorkloadMetrics } from "@/components/workload-metrics"
import { ProductivityMetrics } from "@/components/productivity-metrics"
import { calculateRTP } from "@/lib/calculate-rtp"
import type { User, Task } from "@/types"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface ProductivityDashboardProps {
  users: Promise<User[]>
}

export function ProductivityDashboard({ users: initialUsers }: ProductivityDashboardProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "tasks">("overview")
  const [isLoading, setIsLoading] = useState(true)

  // Load initial users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await initialUsers
        setUsers(userList)
        setSelectedUser(userList[0])
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading users:", error)
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [initialUsers])

  // Handle user selection with loading state
  const handleUserSelect = async (user: User) => {
    setIsLoading(true)
    
    // Simulate async loading (remove this if user selection is instant)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setSelectedUser(user)
    setIsLoading(false)
  }

  // Prevent rendering if no user is selected or loading
  if (isLoading || !selectedUser) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Get the selected user from the updated users array
  const currentUser = users.find((u) => u.name === selectedUser.name) || users[0]

  const rtpScore = calculateRTP(currentUser)
  const lowRTP = calculateRTP(currentUser, "LOW")
  const midRTP = calculateRTP(currentUser, "MID")
  const highRTP = calculateRTP(currentUser, "HIGH")

  // Function to add a new task
  const handleAddTask = (newTask: Task) => {
    const updatedUsers = users.map((user) => {
      if (user.name === currentUser.name) {
        return {
          ...user,
          tasks: [...user.tasks, newTask],
        }
      }
      return user
    })

    setUsers(updatedUsers)
    setShowAddTaskForm(false)
  }

  // Function to update task status
  const handleUpdateTask = (taskIndex: number, completed: boolean, subtaskIndex?: number) => {
    const updatedUsers = users.map((user) => {
      if (user.name === currentUser.name) {
        const updatedTasks = [...user.tasks]

        if (subtaskIndex !== undefined && updatedTasks[taskIndex].subTasks) {
          // Update subtask
          updatedTasks[taskIndex].subTasks![subtaskIndex].completed = completed
        } else {
          // Update main task
          updatedTasks[taskIndex].completed = completed
        }

        return {
          ...user,
          tasks: updatedTasks,
        }
      }
      return user
    })

    setUsers(updatedUsers)
  }

  // Function to update task time tracking
  const handleUpdateTaskTime = (taskIndex: number, actualMinutes: number, subtaskIndex?: number) => {
    const updatedUsers = users.map((user) => {
      if (user.name === currentUser.name) {
        const updatedTasks = [...user.tasks]

        if (subtaskIndex !== undefined && updatedTasks[taskIndex].subTasks) {
          // Update subtask
          updatedTasks[taskIndex].subTasks![subtaskIndex].actualMinutes = actualMinutes
        } else {
          // Update main task
          updatedTasks[taskIndex].actualMinutes = actualMinutes
        }

        return {
          ...user,
          tasks: updatedTasks,
        }
      }
      return user
    })

    setUsers(updatedUsers)
  }

  // Function to update task quality rating
  const handleUpdateTaskQuality = (taskIndex: number, qualityRating: number) => {
    const updatedUsers = users.map((user) => {
      if (user.name === currentUser.name) {
        const updatedTasks = [...user.tasks]
        updatedTasks[taskIndex].qualityRating = qualityRating

        return {
          ...user,
          tasks: updatedTasks,
        }
      }
      return user
    })

    setUsers(updatedUsers)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <UserSelector 
          users={users} 
          selectedUser={currentUser} 
          onSelectUser={handleUserSelect} 
        />

        <div className="flex gap-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "tasks")}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button onClick={() => setShowAddTaskForm(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {showAddTaskForm && (
        <AddTaskForm
          onAddTask={handleAddTask}
          onCancel={() => setShowAddTaskForm(false)}
          existingTasks={currentUser.tasks}
          collaborators={users.map((u) => u.name)}
        />
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "overview" | "tasks")}>
        <TabsContent value="overview" className="mt-0 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProductivityMetrics user={currentUser} />
            <WorkloadMetrics user={currentUser} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProductivityScore
              label="Overall RTP"
              percentage={rtpScore.percentage}
              score={rtpScore.score}
              className="bg-white dark:bg-gray-800"
            />
            <ProductivityScore
              label="Low-Level Tasks"
              percentage={lowRTP.percentage}
              score={lowRTP.score}
              className="bg-blue-50 dark:bg-blue-900/20"
            />
            <ProductivityScore
              label="Mid-Level Tasks"
              percentage={midRTP.percentage}
              score={midRTP.score}
              className="bg-purple-50 dark:bg-purple-900/20"
            />
            <ProductivityScore
              label="High-Level Tasks"
              percentage={highRTP.percentage}
              score={highRTP.score}
              className="bg-orange-50 dark:bg-orange-900/20"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TaskBreakdown user={currentUser} />
            <TaskList
              user={currentUser}
              onUpdateTask={handleUpdateTask}
              onUpdateTaskTime={handleUpdateTaskTime}
              onUpdateTaskQuality={handleUpdateTaskQuality}
              limit={5}
            />
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          <TaskList
            user={currentUser}
            onUpdateTask={handleUpdateTask}
            onUpdateTaskTime={handleUpdateTaskTime}
            onUpdateTaskQuality={handleUpdateTaskQuality}
            showFilters={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}