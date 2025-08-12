import { createSlice, nanoid } from '@reduxjs/toolkit'

import type { PayloadAction } from '@reduxjs/toolkit';

export interface Enrollment { courseId: string; progress: number }
export interface ChatSummary { id: string; title: string; messageCount: number }
export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  enrollments: Enrollment[]
  chats: ChatSummary[]
}

interface AddUserPayload { name: string; email: string; isAdmin?: boolean }

interface UsersState { items: User[] }

const initialState: UsersState = {
  items: [
    {
      id: 'u1', name: 'Jad H.', email: 'jad@example.com', isAdmin: true,
      enrollments: [ { courseId: 'c1', progress: 60 }, { courseId: 'c2', progress: 25 } ],
      chats: [ { id: 'ch1', title: 'AWS Learning Chat', messageCount: 12 } ],
    },
    {
      id: 'u2', name: 'Sara K.', email: 'sara@example.com', isAdmin: false,
      enrollments: [ { courseId: 'c3', progress: 80 } ],
      chats: [ { id: 'ch2', title: 'Serverless Q&A', messageCount: 7 } ],
    },
  ],
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<AddUserPayload>) => {
      const { name, email, isAdmin = false } = action.payload
      state.items.push({ id: nanoid(), name, email, isAdmin, enrollments: [], chats: [] })
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((u) => u.id !== action.payload)
    },
  },
})

export const { addUser, deleteUser } = usersSlice.actions
export default usersSlice.reducer

// selectors
export const selectUserById = (state: { users: UsersState }, id: string) =>
  state.users.items.find((u) => u.id === id)