"use client"

import { useState } from "react"
import type { Task, TaskType, PriorityScale } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { PlusCircle, Trash2, Clock, Users, Tag } from "lucide-react"
import { classifyTask } from "@/lib/calculate-rtp"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface AddTaskFormProps {
  onAddTask: (task: Task) => void
  onCancel: () => void
  existingTasks?: Task[] // For task dependencies
  collaborators?: string[] // Available collaborators
}

export function AddTaskForm({ onAddTask, onCancel, existingTasks = [], collaborators = [] }: AddTaskFormProps) {
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [startDateTime, setStartDateTime] = useState("")
  const [endDateTime, setEndDateTime] = useState("")
  const [taskType, setTaskType] = useState<TaskType | "AUTO">("AUTO")
  const [priority, setPriority] = useState<PriorityScale | null>(null)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null)
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [blockedByTasks, setBlockedByTasks] = useState<string[]>([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly" | "monthly" | "none">("none")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const [subtasks, setSubtasks] = useState<
    Array<{
      name: string
      description: string
      startDateTime: string
      endDateTime: string
      estimatedMinutes?: number
      priority?: PriorityScale
    }>
  >([])

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      {
        name: "",
        description: "",
        startDateTime: "",
        endDateTime: "",
      },
    ])
  }

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleSubtaskChange = (index: number, field: string, value: string | number) => {
    const updatedSubtasks = [...subtasks]
    updatedSubtasks[index] = {
      ...updatedSubtasks[index],
      [field]: value,
    }
    setSubtasks(updatedSubtasks)
  }

  const handleCollaboratorToggle = (collaborator: string) => {
    if (selectedCollaborators.includes(collaborator)) {
      setSelectedCollaborators(selectedCollaborators.filter((c) => c !== collaborator))
    } else {
      setSelectedCollaborators([...selectedCollaborators, collaborator])
    }
  }

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleBlockingTaskToggle = (taskId: string) => {
    if (blockedByTasks.includes(taskId)) {
      setBlockedByTasks(blockedByTasks.filter((id) => id !== taskId))
    } else {
      setBlockedByTasks([...blockedByTasks, taskId])
    }
  }

  const handleSubmit = () => {
    // Validate form
    if (!taskName || !startDateTime || !endDateTime) {
      alert("Please fill in all required fields")
      return
    }

    // Auto-classify if needed
    const classification =
      taskType === "AUTO"
        ? classifyTask({
            name: taskName,
            description: taskDescription,
            startDateTime,
            endDateTime,
            subTasks: subtasks.map((s) => ({ ...s, completed: false, type: "" })),
            estimatedMinutes: estimatedMinutes ?? undefined,
            collaborators: selectedCollaborators,
          })
        : { type: taskType, priority: priority || (5 as PriorityScale) }

    // Create task object with enhanced properties
    const newTask: Task = {
      id: `task-${Date.now()}`, // Generate a simple ID
      name: taskName,
      description: taskDescription,
      startDateTime,
      endDateTime,
      completed: false,
      type: classification.type,
      priority: priority || classification.priority,
      estimatedMinutes: estimatedMinutes || undefined,
      collaborators: selectedCollaborators.length > 0 ? selectedCollaborators : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      blockedBy: blockedByTasks.length > 0 ? blockedByTasks : undefined,
      recurrence: isRecurring ? recurrenceType : "none",
      subTasks:
        subtasks.length > 0
          ? subtasks.map((subtask, index) => {
              const subtaskClassification =
                taskType === "AUTO"
                  ? classifyTask({
                      name: subtask.name,
                      description: subtask.description,
                      startDateTime: subtask.startDateTime,
                      endDateTime: subtask.endDateTime,
                      estimatedMinutes: subtask.estimatedMinutes,
                    })
                  : { type: taskType, priority: subtask.priority || classification.priority }

              return {
                id: `subtask-${Date.now()}-${index}`,
                ...subtask,
                completed: false,
                type: subtaskClassification.type,
                priority: subtask.priority || subtaskClassification.priority,
              }
            })
          : undefined,
    }

    onAddTask(newTask)
  }

  // Common tags for demonstration
  const commonTags = ["Work", "Personal", "Meeting", "Development", "Research", "Learning", "Admin"]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add New Task</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-name">Task Name *</Label>
          <Input
            id="task-name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Enter task description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date & Time *</Label>
            <Input
              id="start-date"
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date & Time *</Label>
            <Input
              id="end-date"
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Task Type</Label>
          <RadioGroup
            value={taskType}
            onValueChange={(value) => setTaskType(value as TaskType | "AUTO")}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AUTO" id="auto" />
              <Label htmlFor="auto">Auto-classify (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="LOW" id="low" />
              <Label htmlFor="low">Low Priority</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MID" id="mid" />
              <Label htmlFor="mid">Medium Priority</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="HIGH" id="high" />
              <Label htmlFor="high">High Priority</Label>
            </div>
          </RadioGroup>
        </div>

        {taskType !== "AUTO" && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="priority-slider">Priority Level (1-10)</Label>
              <span className="text-sm font-medium">{priority || 5}</span>
            </div>
            <Slider
              id="priority-slider"
              min={1}
              max={10}
              step={1}
              value={[priority || 5]}
              onValueChange={(value) => setPriority(value[0] as PriorityScale)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="estimated-time">Estimated Time (minutes)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="estimated-time"
              type="number"
              min={1}
              value={estimatedMinutes || ""}
              onChange={(e) => setEstimatedMinutes(e.target.value ? Number.parseInt(e.target.value) : null)}
              placeholder="e.g., 60 for 1 hour"
            />
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="advanced-options" checked={showAdvancedOptions} onCheckedChange={setShowAdvancedOptions} />
          <Label htmlFor="advanced-options">Show Advanced Options</Label>
        </div>

        {showAdvancedOptions && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recurrence</Label>
                <Switch id="recurring-task" checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>

              {isRecurring && (
                <Select
                  value={recurrenceType}
                  onValueChange={(value) => setRecurrenceType(value as "daily" | "weekly" | "monthly" | "none")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {commonTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {collaborators.length > 0 && (
              <div className="space-y-2">
                <Label>Collaborators</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {collaborators.map((collaborator) => (
                    <Badge
                      key={collaborator}
                      variant={selectedCollaborators.includes(collaborator) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleCollaboratorToggle(collaborator)}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      {collaborator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {existingTasks.length > 0 && (
              <div className="space-y-2">
                <Label>Blocked By Tasks</Label>
                <div className="flex flex-col gap-2 mt-1">
                  {existingTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <Switch
                        id={`blocking-task-${task.id}`}
                        checked={blockedByTasks.includes(task.id || "")}
                        onCheckedChange={() => handleBlockingTaskToggle(task.id || "")}
                        disabled={!task.id}
                      />
                      <Label htmlFor={`blocking-task-${task.id}`}>{task.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Subtasks</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubtask}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add Subtask
            </Button>
          </div>

          {subtasks.map((subtask, index) => (
            <div key={index} className="border rounded-md p-4 space-y-3 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Subtask {index + 1}</h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveSubtask(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`subtask-name-${index}`}>Name</Label>
                <Input
                  id={`subtask-name-${index}`}
                  value={subtask.name}
                  onChange={(e) => handleSubtaskChange(index, "name", e.target.value)}
                  placeholder="Enter subtask name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`subtask-description-${index}`}>Description</Label>
                <Textarea
                  id={`subtask-description-${index}`}
                  value={subtask.description}
                  onChange={(e) => handleSubtaskChange(index, "description", e.target.value)}
                  placeholder="Enter subtask description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`subtask-start-${index}`}>Start Date & Time</Label>
                  <Input
                    id={`subtask-start-${index}`}
                    type="datetime-local"
                    value={subtask.startDateTime}
                    onChange={(e) => handleSubtaskChange(index, "startDateTime", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subtask-end-${index}`}>End Date & Time</Label>
                  <Input
                    id={`subtask-end-${index}`}
                    type="datetime-local"
                    value={subtask.endDateTime}
                    onChange={(e) => handleSubtaskChange(index, "endDateTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`subtask-estimated-time-${index}`}>Estimated Time (minutes)</Label>
                <Input
                  id={`subtask-estimated-time-${index}`}
                  type="number"
                  min={1}
                  value={subtask.estimatedMinutes || ""}
                  onChange={(e) =>
                    handleSubtaskChange(
                      index,
                      "estimatedMinutes",
                      e.target.value ? Number.parseInt(e.target.value) : "",
                    )
                  }
                  placeholder="e.g., 30 for 30 minutes"
                />
              </div>

              {taskType !== "AUTO" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor={`subtask-priority-${index}`}>Priority Level (1-10)</Label>
                    <span className="text-sm font-medium">{subtask.priority || 5}</span>
                  </div>
                  <Slider
                    id={`subtask-priority-${index}`}
                    min={1}
                    max={10}
                    step={1}
                    value={[subtask.priority || 5]}
                    onValueChange={(value) => handleSubtaskChange(index, "priority", value[0])}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Add Task</Button>
      </CardFooter>
    </Card>
  )
}

