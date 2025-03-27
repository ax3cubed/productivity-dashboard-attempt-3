export type TaskType = "LOW" | "MID" | "HIGH"

// Enhanced priority scale (1-10)
export type PriorityScale = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface SubTask {
  id?: string
  name: string
  description: string
  startDateTime: string
  endDateTime: string
  completed: boolean
  type: string
  priority?: PriorityScale
  estimatedMinutes?: number
  actualMinutes?: number
  blockedBy?: string[] // IDs of tasks that block this subtask
}

export interface Task {
  id?: string
  name: string
  description: string
  startDateTime: string
  endDateTime: string
  completed: boolean
  type: string
  priority?: PriorityScale
  subTasks?: SubTask[]
  estimatedMinutes?: number
  actualMinutes?: number
  blockedBy?: string[] // IDs of tasks that block this task
  collaborators?: string[] // User IDs of collaborators
  qualityRating?: number // 1-5 rating of completed work
  tags?: string[] // For categorization
  recurrence?: "daily" | "weekly" | "monthly" | "none"
}

export interface UserPreferences {
  productiveHours?: { start: number; end: number }[] // e.g. [{ start: 9, end: 12 }, { start: 14, end: 17 }]
  preferredTaskTypes?: TaskType[]
  workloadCapacity?: number // Tasks per day
  weightPreferences?: {
    deadline: number // 0-1 importance of deadline in calculations
    priority: number // 0-1 importance of priority
    complexity: number // 0-1 importance of task complexity
  }
}

export interface User {
  name: string
  tasks: Task[]
  preferences?: UserPreferences
  productivityHistory?: {
    date: string
    score: number
    tasksCompleted: number
    totalTasks: number
  }[]
}

export interface WorkloadMetrics {
  dailyCapacity: number
  currentLoad: number
  overloadFactor: number // >1 means overloaded
  upcomingDeadlines: number
  blockedTasks: number
}

