"use client"

import { useState } from "react"
import type { User, Task, TaskType } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ChevronDown, ChevronRight, Clock, Star, Tag, Users, Calendar } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "motion/react"
import { Label } from "@/components/ui/label"

interface TaskListProps {
  user: User
  onUpdateTask: (taskIndex: number, completed: boolean, subtaskIndex?: number) => void
  onUpdateTaskTime?: (taskIndex: number, actualMinutes: number, subtaskIndex?: number) => void
  onUpdateTaskQuality?: (taskIndex: number, qualityRating: number) => void
  limit?: number
  showFilters?: boolean
}

export function TaskList({
  user,
  onUpdateTask,
  onUpdateTaskTime,
  onUpdateTaskQuality,
  limit,
  showFilters = false,
}: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState<TaskType | "ALL">("ALL")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "COMPLETED" | "PENDING">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "name">("deadline")
  const tasksPerPage = limit || 10

  // Filter tasks based on criteria
  const filteredTasks = user.tasks.filter((task) => {
    // Filter by type
    if (filterType !== "ALL" && task.type !== filterType) return false

    // Filter by status
    if (filterStatus === "COMPLETED" && !task.completed) return false
    if (filterStatus === "PENDING" && task.completed) return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = task.name.toLowerCase().includes(query)
      const matchesDescription = task.description.toLowerCase().includes(query)
      const matchesTags = task.tags?.some((tag) => tag.toLowerCase().includes(query))

      if (!matchesName && !matchesDescription && !matchesTags) return false
    }

    return true
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.endDateTime).getTime() - new Date(b.endDateTime).getTime()
    } else if (sortBy === "priority") {
      const aPriority = a.priority || 5
      const bPriority = b.priority || 5
      return bPriority - aPriority // Higher priority first
    } else {
      return a.name.localeCompare(b.name)
    }
  })

  // Calculate pagination
  const totalTasks = sortedTasks.length
  const totalPages = Math.ceil(totalTasks / tasksPerPage)
  const startIndex = (currentPage - 1) * tasksPerPage
  const endIndex = Math.min(startIndex + tasksPerPage, totalTasks)
  const currentTasks = sortedTasks.slice(startIndex, endIndex)

  const getTaskTypeBadge = (type: TaskType) => {
    const colors = {
      LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      MID: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    }

    return (
      <Badge className={colors[type]} variant="outline">
        {type}
      </Badge>
    )
  }

  const getPriorityBadge = (priority?: number) => {
    if (!priority) return null

    let color = "bg-gray-100 text-gray-800"
    if (priority >= 8) color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    else if (priority >= 6) color = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    else if (priority >= 4) color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    else color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"

    return (
      <Badge className={color} variant="outline">
        P{priority}
      </Badge>
    )
  }

  // Check if a task is overdue
  const isOverdue = (task: Task) => {
    const now = new Date()
    const deadline = new Date(task.endDateTime)
    return now > deadline && !task.completed
  }

  // Toggle expanded state for a task
  const toggleTaskExpanded = (index: number) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [startIndex + index]: !prev[startIndex + index],
    }))
  }

  // Check if a task is expanded
  const isTaskExpanded = (index: number) => {
    return !!expandedTasks[startIndex + index]
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Handle time tracking update
  const handleTimeUpdate = (taskIndex: number, minutes: number, subtaskIndex?: number) => {
    if (onUpdateTaskTime) {
      onUpdateTaskTime(startIndex + taskIndex, minutes, subtaskIndex)
    }
  }

  // Handle quality rating update
  const handleQualityUpdate = (taskIndex: number, rating: number) => {
    if (onUpdateTaskQuality) {
      onUpdateTaskQuality(startIndex + taskIndex, rating)
    }
  }

  // Generate pagination items
  const getPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink isActive={currentPage === 1} onClick={() => handlePageChange(1)}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink isActive={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-col sm:flex-row gap-3 mt-2"
          >
            <div className="flex-1">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(value) => setFilterType(value as TaskType | "ALL")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MID">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as "ALL" | "COMPLETED" | "PENDING")}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "deadline" | "priority" | "name")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </CardHeader>

      <CardContent>
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
          {currentTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              No tasks match your criteria
            </motion.div>
          ) : (
            currentTasks.map((task, index) => {
              const actualIndex = startIndex + index
              const hasSubtasks = task.subTasks && task.subTasks.length > 0
              const isExpanded = isTaskExpanded(index)
              const isTaskOverdue = isOverdue(task)

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`border rounded-lg p-4 dark:border-gray-700 ${
                    isTaskOverdue ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10" : ""
                  }`}
                  whileHover={{
                    scale: 1.01,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                    transition: { duration: 0.2 },
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => onUpdateTask(actualIndex, checked === true)}
                        className="mt-1"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{task.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs flex items-center text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.endDateTime).toLocaleString()}
                          </span>

                          {task.estimatedMinutes && (
                            <span className="text-xs flex items-center text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Est: {task.estimatedMinutes} min
                            </span>
                          )}

                          {task.actualMinutes && (
                            <span className="text-xs flex items-center text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Actual: {task.actualMinutes} min
                            </span>
                          )}

                          {isTaskOverdue && (
                            <motion.span
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-xs font-medium text-red-600 dark:text-red-400"
                            >
                              Overdue
                            </motion.span>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs py-0">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Collaborators */}
                        {task.collaborators && task.collaborators.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            <span>Collaborators: {task.collaborators.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTaskTypeBadge(task.type as TaskType)}
                      {getPriorityBadge(task.priority)}

                      {task.completed && onUpdateTaskQuality && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Star className="h-4 w-4" fill={task.qualityRating ? "currentColor" : "none"} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Rate Task Quality</h4>
                              <div className="flex justify-between">
                                <span className="text-sm">Low</span>
                                <span className="text-sm">High</span>
                              </div>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[task.qualityRating || 3]}
                                onValueChange={(value) => handleQualityUpdate(index, value[0])}
                              />
                              <div className="flex justify-between">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className="h-5 w-5 cursor-pointer"
                                    fill={star <= (task.qualityRating || 0) ? "currentColor" : "none"}
                                    onClick={() => handleQualityUpdate(index, star)}
                                  />
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      {onUpdateTaskTime && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Clock className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">Track Time</h4>
                              <div className="space-y-1">
                                <Label>Actual time spent (minutes)</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={task.actualMinutes || ""}
                                  onChange={(e) => handleTimeUpdate(index, Number.parseInt(e.target.value) || 0)}
                                  placeholder="Enter time in minutes"
                                />
                              </div>
                              {task.estimatedMinutes && (
                                <p className="text-xs text-muted-foreground">
                                  Estimated: {task.estimatedMinutes} minutes
                                </p>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}

                      {hasSubtasks && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleTaskExpanded(index)}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {hasSubtasks && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pl-8 space-y-2 overflow-hidden"
                      >
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subtasks ({task.subTasks!.filter((st) => st.completed).length}/{task.subTasks!.length}):
                        </h5>
                        {task.subTasks!.map((subtask, subIndex) => (
                          <motion.div
                            key={subIndex}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: subIndex * 0.05 }}
                          >
                            <Checkbox
                              checked={subtask.completed}
                              onCheckedChange={(checked) => onUpdateTask(actualIndex, checked === true, subIndex)}
                            />
                            <div>
                              <h6 className="font-medium text-gray-800 dark:text-gray-200">{subtask.name}</h6>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{subtask.description}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Due: {new Date(subtask.endDateTime).toLocaleString()}
                                </span>

                                {subtask.estimatedMinutes && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Est: {subtask.estimatedMinutes} min
                                  </span>
                                )}

                                {subtask.actualMinutes && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Actual: {subtask.actualMinutes} min
                                  </span>
                                )}

                                {isOverdue(subtask) && (
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Overdue</span>
                                )}
                              </div>
                            </div>

                            {onUpdateTaskTime && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Track Subtask Time</h4>
                                    <div className="space-y-1">
                                      <Label>Actual time spent (minutes)</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={subtask.actualMinutes || ""}
                                        onChange={(e) =>
                                          handleTimeUpdate(index, Number.parseInt(e.target.value) || 0, subIndex)
                                        }
                                        placeholder="Enter time in minutes"
                                      />
                                    </div>
                                    {subtask.estimatedMinutes && (
                                      <p className="text-xs text-muted-foreground">
                                        Estimated: {subtask.estimatedMinutes} minutes
                                      </p>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </motion.div>

        {totalPages > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {getPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

