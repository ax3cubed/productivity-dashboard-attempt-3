import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TaskType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTaskTypeColor(type: TaskType): string {
  const colors = {
    LOW: "#3b82f6", // blue-500
    MID: "#8b5cf6", // purple-500
    HIGH: "#f97316", // orange-500
  }

  return colors[type]
}

