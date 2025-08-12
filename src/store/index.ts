import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import users from "./usersSlice";
import courses from "./coursesSlice";
import { coursesApi } from "./coursesApi";
import chats from "./chatsSlice";
export const store = configureStore({
  reducer: {
    users,
    courses,
    chats,
    [coursesApi.reducerPath]: coursesApi.reducer,
  },
  middleware: (gDM) => gDM().concat(coursesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;