import type { User, TaskType, Task, PriorityScale, WorkloadMetrics } from "@/types"

// Enhanced task weights with continuous scale
const getPriorityWeight = (priority?: PriorityScale, type?: string): number => {
  // If explicit priority is set, use it (scale 1-10)
  if (priority) {
    return priority
  }

  // Otherwise fall back to type-based weights
  const BASE_TASK_WEIGHTS = {
    LOW: 2,
    MID: 5,
    HIGH: 8,
  }

  return BASE_TASK_WEIGHTS[type as TaskType] || 5
}

/**
 * Calculate Real-Time Productivity (RTP) score with enhanced weighting
 */
export function calculateRTP(
  user: User,
  filterType?: TaskType,
  dateRange?: { start: Date; end: Date },
): { percentage: number; score: number; metrics: any } {
  let weightedCompletedSum = 0
  let weightedTotalSum = 0
  let totalEstimatedTime = 0
  let totalActualTime = 0
  let tasksWithAccurateEstimates = 0
  let totalTasks = 0
  let completedTasks = 0
  let blockedTasks = 0

  // Filter tasks by date range if provided
  const filteredTasks = dateRange
    ? user.tasks.filter((task) => {
        const taskDate = new Date(task.startDateTime)
        return taskDate >= dateRange.start && taskDate <= dateRange.end
      })
    : user.tasks

  // Process each task
  filteredTasks.forEach((task) => {
    const taskType = task.type as TaskType
    totalTasks++

    // Skip if we're filtering by type and this isn't the right type
    if (filterType && taskType !== filterType) return

    // Check if task is blocked
    if (task.blockedBy && task.blockedBy.length > 0) {
      blockedTasks++
    }

    // Get enhanced weight based on multiple factors
    const dynamicWeight = calculateDynamicWeight(task, user)

    // Track time estimates
    if (task.estimatedMinutes) {
      totalEstimatedTime += task.estimatedMinutes
      if (task.actualMinutes) {
        totalActualTime += task.actualMinutes
        tasksWithAccurateEstimates++
      }
    }

    // If the task has subtasks, calculate based on subtask completion
    if (task.subTasks && task.subTasks.length > 0) {
      // Calculate subtask contribution
      const { completedWeight, totalWeight, completedSubtasks } = calculateSubtaskContribution(task)

      if (completedSubtasks === task.subTasks.length && task.completed) {
        completedTasks++
      }

      weightedCompletedSum += dynamicWeight * completedWeight
      weightedTotalSum += dynamicWeight * totalWeight
    } else {
      // Otherwise, use the task's own completion status
      if (task.completed) {
        completedTasks++
      }

      weightedCompletedSum += task.completed ? dynamicWeight : 0
      weightedTotalSum += dynamicWeight
    }
  })

  // Avoid division by zero
  if (weightedTotalSum === 0)
    return {
      percentage: 0,
      score: 0,
      metrics: {
        estimationAccuracy: 0,
        completionRate: 0,
        blockedTasksPercentage: 0,
        averageTaskWeight: 0,
      },
    }

  // Calculate the RTP as a percentage
  const percentage = (weightedCompletedSum / weightedTotalSum) * 100

  // Calculate the raw score (sum of weighted completed tasks)
  const score = Math.round(weightedCompletedSum)

  // Calculate additional metrics
  const estimationAccuracy =
    tasksWithAccurateEstimates > 0
      ? Math.min(100, 100 - Math.abs(((totalActualTime - totalEstimatedTime) / totalEstimatedTime) * 100))
      : null

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  const blockedTasksPercentage = totalTasks > 0 ? (blockedTasks / totalTasks) * 100 : 0
  const averageTaskWeight = totalTasks > 0 ? weightedTotalSum / totalTasks : 0

  return {
    percentage,
    score,
    metrics: {
      estimationAccuracy,
      completionRate,
      blockedTasksPercentage,
      averageTaskWeight,
    },
  }
}

/**
 * Calculate dynamic weight based on multiple factors:
 * - Task priority/type
 * - Deadline proximity (contextual to task size)
 * - User preferences
 * - Task complexity (subtasks, collaborators)
 */
function calculateDynamicWeight(task: Task, user: User): number {
  // Start with base priority weight
  const baseWeight = getPriorityWeight(task.priority, task.type)
  let dynamicWeight = baseWeight

  // Get user preferences or use defaults
  const preferences = user.preferences?.weightPreferences || {
    deadline: 0.4,
    priority: 0.4,
    complexity: 0.2,
  }

  // 1. Adjust for deadline proximity (contextual to task duration)
  const now = new Date()
  const deadline = new Date(task.endDateTime)
  const start = new Date(task.startDateTime)
  const timeRemaining = deadline.getTime() - now.getTime()
  const totalTaskDuration = deadline.getTime() - start.getTime()

  // If task has a very short duration, even a small time remaining is significant
  const durationFactor = Math.max(1, Math.log10(totalTaskDuration / (1000 * 60 * 60 * 24)))

  // Calculate urgency based on proportion of time remaining relative to total duration
  let urgencyFactor = 1
  if (timeRemaining > 0 && totalTaskDuration > 0) {
    const proportionRemaining = timeRemaining / totalTaskDuration
    // More urgent as less proportion of time remains
    urgencyFactor = 1 + (1 - proportionRemaining) * 0.5 * durationFactor
  }

  // If task is overdue, increase weight significantly
  if (timeRemaining < 0) {
    // More overdue = higher weight, but cap at 3x
    const overdueMultiplier = Math.min(3, 1 + Math.abs(timeRemaining) / (totalTaskDuration || 1000 * 60 * 60 * 24))
    urgencyFactor = overdueMultiplier
  }

  // 2. Adjust for task complexity
  let complexityFactor = 1

  // More subtasks = more complex
  if (task.subTasks && task.subTasks.length > 0) {
    complexityFactor += 0.1 * Math.min(10, task.subTasks.length)
  }

  // Collaborative tasks are more complex
  if (task.collaborators && task.collaborators.length > 0) {
    complexityFactor += 0.1 * Math.min(5, task.collaborators.length)
  }

  // 3. Apply user preference weightings
  dynamicWeight =
    (baseWeight * preferences.priority +
      baseWeight * urgencyFactor * preferences.deadline +
      baseWeight * complexityFactor * preferences.complexity) /
    (preferences.priority + preferences.deadline + preferences.complexity)

  // 4. Adjust for productive hours if available
  if (user.preferences?.productiveHours && user.preferences.productiveHours.length > 0) {
    const currentHour = now.getHours()
    const isProductiveHour = user.preferences.productiveHours.some(
      (range) => currentHour >= range.start && currentHour < range.end,
    )

    // Tasks during productive hours get a slight boost
    if (isProductiveHour) {
      dynamicWeight *= 1.1
    }
  }

  // 5. Adjust for workload capacity
  if (user.preferences?.workloadCapacity) {
    const workloadMetrics = calculateWorkloadMetrics(user)

    // If user is overloaded, prioritize high-value tasks even more
    if (workloadMetrics.overloadFactor > 1) {
      // Increase weight disparity - make high priority tasks even more important
      dynamicWeight = Math.pow(dynamicWeight, 1.2)
    }
  }

  return dynamicWeight
}

/**
 * Calculate subtask contribution to parent task with enhanced logic
 */
function calculateSubtaskContribution(task: Task): {
  completedWeight: number
  totalWeight: number
  completedSubtasks: number
} {
  const subtasks = task.subTasks || []
  const totalSubtasks = subtasks.length

  if (totalSubtasks === 0) {
    return {
      completedWeight: task.completed ? 1 : 0,
      totalWeight: 1,
      completedSubtasks: task.completed ? 1 : 0,
    }
  }

  // Count completed subtasks
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length

  // Calculate weighted completion based on subtask priorities if available
  let weightedCompletion = 0
  let totalSubtaskWeight = 0

  subtasks.forEach((subtask) => {
    const subtaskWeight = getPriorityWeight(subtask.priority, subtask.type)
    totalSubtaskWeight += subtaskWeight

    if (subtask.completed) {
      weightedCompletion += subtaskWeight
    }
  })

  // If subtasks have priorities, use weighted completion
  if (totalSubtaskWeight > 0) {
    return {
      completedWeight: weightedCompletion / totalSubtaskWeight,
      totalWeight: 1, // The parent task counts as 1 total task
      completedSubtasks,
    }
  }

  // Otherwise use simple ratio
  return {
    completedWeight: completedSubtasks / totalSubtasks,
    totalWeight: 1, // The parent task counts as 1 total task
    completedSubtasks,
  }
}

/**
 * Calculate user workload metrics
 */
export function calculateWorkloadMetrics(user: User): WorkloadMetrics {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(23, 59, 59, 999)

  // Default capacity if not set
  const dailyCapacity = user.preferences?.workloadCapacity || 5

  // Count tasks due today or tomorrow
  const upcomingTasks = user.tasks.filter((task) => {
    const deadline = new Date(task.endDateTime)
    return deadline <= tomorrow && !task.completed
  })

  // Count blocked tasks
  const blockedTasks = user.tasks.filter(
    (task) => !task.completed && task.blockedBy && task.blockedBy.length > 0,
  ).length

  // Calculate current load
  const currentLoad = upcomingTasks.length

  // Calculate overload factor
  const overloadFactor = currentLoad / dailyCapacity

  // Count upcoming deadlines (next 3 days)
  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const upcomingDeadlines = user.tasks.filter((task) => {
    const deadline = new Date(task.endDateTime)
    return deadline <= threeDaysFromNow && deadline > tomorrow && !task.completed
  }).length

  return {
    dailyCapacity,
    currentLoad,
    overloadFactor,
    upcomingDeadlines,
    blockedTasks,
  }
}

/**
 * Enhanced task classification with more sophisticated rules
 */
export function classifyTask(task: Partial<Task>): { type: TaskType; priority: PriorityScale } {
  // Initialize scores for each task type
  const scores = {
    LOW: 0,
    MID: 0,
    HIGH: 0,
  }

  // Rule 1: Check task description length (longer descriptions often indicate more complex tasks)
  const descriptionLength = (task.description || "").length
  if (descriptionLength > 300) scores.HIGH += 3
  else if (descriptionLength > 150) scores.HIGH += 2
  else if (descriptionLength > 80) scores.MID += 2
  else scores.LOW += 1

  // Rule 2: Check for subtasks (more subtasks indicate higher complexity)
  const subtaskCount = task.subTasks?.length || 0
  if (subtaskCount > 5) scores.HIGH += 4
  else if (subtaskCount > 3) scores.HIGH += 3
  else if (subtaskCount > 0) scores.MID += 2
  else scores.LOW += 1

  // Rule 3: Check task duration (longer tasks are often more significant)
  if (task.startDateTime && task.endDateTime) {
    const start = new Date(task.startDateTime)
    const end = new Date(task.endDateTime)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    if (durationHours > 24) scores.HIGH += 3
    else if (durationHours > 8) scores.HIGH += 2
    else if (durationHours > 2) scores.MID += 2
    else scores.LOW += 2
  }

  // Rule 4: Check for keywords in title and description that might indicate priority
  const text = `${task.name || ""} ${task.description || ""}`.toLowerCase()
  const highPriorityKeywords = [
    "urgent",
    "critical",
    "important",
    "deadline",
    "priority",
    "asap",
    "emergency",
    "crucial",
  ]
  const midPriorityKeywords = ["review", "update", "prepare", "meeting", "report", "develop", "implement", "analyze"]
  const lowPriorityKeywords = ["check", "read", "reminder", "routine", "daily", "follow-up", "monitor", "maintain"]

  highPriorityKeywords.forEach((keyword) => {
    if (text.includes(keyword)) scores.HIGH += 1
  })

  midPriorityKeywords.forEach((keyword) => {
    if (text.includes(keyword)) scores.MID += 1
  })

  lowPriorityKeywords.forEach((keyword) => {
    if (text.includes(keyword)) scores.LOW += 1
  })

  // Rule 5: Check for collaborators (collaborative tasks often have higher impact)
  if (task.collaborators && task.collaborators.length > 2) {
    scores.HIGH += 2
  } else if (task.collaborators && task.collaborators.length > 0) {
    scores.MID += 1
  }

  // Rule 6: Check if task is blocked by other tasks
  if (task.blockedBy && task.blockedBy.length > 0) {
    // Tasks that are blocked might be less urgent until unblocked
    scores.MID += 1
  }

  // Rule 7: Check for estimated time
  if (task.estimatedMinutes) {
    if (task.estimatedMinutes > 240)
      scores.HIGH += 2 // >4 hours
    else if (task.estimatedMinutes > 60)
      scores.MID += 2 // >1 hour
    else scores.LOW += 1 // <1 hour
  }

  // Determine the task type based on highest score
  let taskType: TaskType
  if (scores.HIGH > scores.MID && scores.HIGH > scores.LOW) taskType = "HIGH"
  else if (scores.MID > scores.LOW) taskType = "MID"
  else taskType = "LOW"

  // Calculate a priority score on scale 1-10
  const totalScore = scores.LOW + scores.MID + scores.HIGH
  const highContribution = scores.HIGH * 3
  const midContribution = scores.MID * 2
  const lowContribution = scores.LOW

  // Calculate weighted priority (1-10 scale)
  const weightedScore = (highContribution + midContribution + lowContribution) / (totalScore || 1)
  const priority = Math.max(1, Math.min(10, Math.round(weightedScore * 3))) as PriorityScale

  return { type: taskType, priority }
}

