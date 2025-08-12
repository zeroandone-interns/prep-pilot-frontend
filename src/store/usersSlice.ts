// src/store/usersSlice.ts
import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Enrollment { courseId: string; progress: number }
export interface ChatSummary { id: string; title: string; messageCount: number }

export type UserRole = 'learner' | 'admin'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  enrollments: Enrollment[]
  chats: ChatSummary[]
}

interface AddUserPayload {
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

interface UpdateUserPayload {
  id: string
  changes: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'role'>>
}

interface UsersState { items: User[] }

// Seed data adjusted to new shape
const initialState: UsersState = {
  items: [
    {
      id: 'u1',
      firstName: 'Jad',
      lastName: 'H.',
      email: 'jad@example.com',
      role: 'admin',
      enrollments: [
        { courseId: 'c1', progress: 60 },
        { courseId: 'c2', progress: 25 },
      ],
      chats: [{ id: 'ch1', title: 'AWS Learning Chat', messageCount: 12 }],
    },
    {
      id: 'u2',
      firstName: 'Sara',
      lastName: 'K.',
      email: 'sara@example.com',
      role: 'learner',
      enrollments: [{ courseId: 'c3', progress: 80 }],
      chats: [{ id: 'ch2', title: 'Serverless Q&A', messageCount: 7 }],
    },
  ],
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<AddUserPayload>) => {
      const { firstName, lastName, email, role } = action.payload
      state.items.push({
        id: nanoid(),
        firstName,
        lastName,
        email,
        role,
        enrollments: [],
        chats: [],
      })
    },
    updateUser: (state, action: PayloadAction<UpdateUserPayload>) => {
      const { id, changes } = action.payload
      const u = state.items.find((x) => x.id === id)
      if (!u) return
      if (changes.firstName !== undefined) u.firstName = changes.firstName
      if (changes.lastName !== undefined) u.lastName = changes.lastName
      if (changes.email !== undefined) u.email = changes.email
      if (changes.role !== undefined) u.role = changes.role
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((u) => u.id !== action.payload)
    },
  },
})

export const { addUser, updateUser, deleteUser } = usersSlice.actions
export default usersSlice.reducer

// selectors
export const selectUserById = (state: { users: UsersState }, id: string) =>
  state.users.items.find((u) => u.id === id)
