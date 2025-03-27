"use client"

import type { User } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserSelectorProps {
  users: User[]
  selectedUser?: User
  onSelectUser: (user: User) => void
}

export function UserSelector({ users, selectedUser, onSelectUser }: UserSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <Select
        value={selectedUser?.name}
        onValueChange={(value) => {
          const user = users.find((u) => u.name === value)
          if (user) onSelectUser(user)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.name} value={user.name}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

