import type { User, Task, SubTask } from "@/types"

// Helper function to generate dates within a range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().slice(0, 16).replace("T", " ")
}

// Helper function to generate a task
function generateTask(
  name: string,
  description: string,
  type: string,
  startDate: Date,
  endDate: Date,
  completed = false,
  subTasks?: SubTask[],
): Task {
  return {
    name,
    description,
    startDateTime: randomDate(startDate, new Date(endDate.getTime() - 1000 * 60 * 60 * 24)),
    endDateTime: randomDate(new Date(startDate.getTime() + 1000 * 60 * 60 * 24), endDate),
    completed,
    type,
    subTasks,
  }
}

// Generate tasks for a specific month with daily distribution
function generateMonthlyTasks(year: number, month: number, completionRate = 0.7): Task[] {
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = endOfMonth.getDate()

  const tasks: Task[] = []

  // Generate tasks distributed across the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Skip some days randomly to make the data more realistic
    if (Math.random() > 0.7) continue

    const dayStart = new Date(year, month, day)
    const dayEnd = new Date(year, month, day, 23, 59, 59)

    // Adjust completion rate slightly for variety
    const dailyCompletionRate = completionRate * (0.9 + Math.random() * 0.2)

    // Generate 0-2 HIGH priority tasks per day
    if (Math.random() > 0.7) {
      const hasSubtasks = Math.random() > 0.5
      const completed = Math.random() < dailyCompletionRate

      let subTasks: SubTask[] | undefined = undefined
      if (hasSubtasks) {
        const subtaskCount = 1 + Math.floor(Math.random() * 2)
        subTasks = []

        for (let j = 0; j < subtaskCount; j++) {
          const subtaskCompleted = completed ? Math.random() < 0.8 : Math.random() < 0.3
          subTasks.push({
            name: `Subtask ${j + 1} for High Priority Task on ${dayStart.toLocaleDateString()}`,
            description: `This is a subtask for the high priority task on ${dayStart.toLocaleDateString()}.`,
            startDateTime: randomDate(dayStart, new Date(dayEnd.getTime() - 1000 * 60 * 60)),
            endDateTime: randomDate(new Date(dayStart.getTime() + 1000 * 60 * 60), dayEnd),
            completed: subtaskCompleted,
            type: "HIGH",
          })
        }
      }

      tasks.push(
        generateTask(
          `High Priority Task - ${dayStart.toLocaleDateString()}`,
          `This is a high priority task for ${dayStart.toLocaleDateString()}.`,
          "HIGH",
          dayStart,
          dayEnd,
          completed,
          subTasks,
        ),
      )
    }

    // Generate 0-3 MID priority tasks per day
    const midTaskCount = Math.floor(Math.random() * 3)
    for (let i = 0; i < midTaskCount; i++) {
      const completed = Math.random() < dailyCompletionRate + 0.1

      tasks.push(
        generateTask(
          `Mid Priority Task ${i + 1} - ${dayStart.toLocaleDateString()}`,
          `This is a medium priority task for ${dayStart.toLocaleDateString()}.`,
          "MID",
          dayStart,
          dayEnd,
          completed,
        ),
      )
    }

    // Generate 1-3 LOW priority tasks per day
    const lowTaskCount = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < lowTaskCount; i++) {
      const completed = Math.random() < dailyCompletionRate + 0.2

      tasks.push(
        generateTask(
          `Low Priority Task ${i + 1} - ${dayStart.toLocaleDateString()}`,
          `This is a low priority task for ${dayStart.toLocaleDateString()}.`,
          "LOW",
          dayStart,
          dayEnd,
          completed,
        ),
      )
    }
  }

  return tasks
}

// Generate 6 months of data for each user with varying completion rates
function generateUserData(userName: string, completionRates: number[]): User {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  let allTasks: Task[] = []

  // Generate tasks for the past 6 months
  for (let i = 0; i < 6; i++) {
    const month = (currentMonth - 5 + i) % 12
    const year = currentYear - (month > currentMonth ? 1 : 0)

    const monthlyTasks = generateMonthlyTasks(year, month, completionRates[i])
    allTasks = [...allTasks, ...monthlyTasks]
  }

  return {
    name: userName,
    tasks: allTasks,
  }
}

// Generate extended sample data for 3 users with different productivity patterns
export const extendedUsers: User[] = [
  // Alice: Consistent high performer
  generateUserData("Alice Green", [0.85, 0.82, 0.88, 0.9, 0.87, 0.92]),

  // Bob: Improving over time
  generateUserData("Bob Smith", [0.55, 0.6, 0.65, 0.7, 0.75, 0.8]),

  // Charlie: Fluctuating performance
  generateUserData("Charlie Davis", [0.75, 0.6, 0.85, 0.65, 0.9, 0.7]),
]

