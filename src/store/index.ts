
import { configureStore, combineReducers } from "@reduxjs/toolkit";

import users from "./usersSlice";
import courses from "./coursesSlice";
import chats from "./chatsSlice";
import Auth from "./AuthSlice";
import course from "./CourseSlice";
import module from "./ModuleSlice";
import section from "./SectionSlice";
import language from "./LanguageSlice";
import learner from "./LearnerViewSlice"
import Next from "./NextSlice"
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

// Persist config for course slice
const coursePersistConfig = {
  key: "course",
  storage,
};

const modulePersistConfig = {
  key: "module",
  storage,
};

const sectionPersistConfig = {
  key: "section",
  storage,
};

const languagePersistConfig = {
  key: "language",
  storage,
};

const learnerPersistConfig = {
  key: "learner",
  storage,
};

const NextPersistConfig = {
  key: "Next",
  storage,
};
const persistedCourseReducer = persistReducer(coursePersistConfig, course);
const persistedModuleReducer = persistReducer(modulePersistConfig, module);
const persistedSectionReducer = persistReducer(sectionPersistConfig, section);
const persistedLanguageReducer = persistReducer( languagePersistConfig,language);
const persistedLearnerReducer = persistReducer(learnerPersistConfig, learner);
const persistedNextReducer = persistReducer(NextPersistConfig, Next);

const rootReducer = combineReducers({
  users,
  courses,
  chats,
  Auth,
  course: persistedCourseReducer,
  module: persistedModuleReducer,
  section: persistedSectionReducer,
  language: persistedLanguageReducer,
  learner: persistedLearnerReducer,
  Next: persistedNextReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 👇 ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: true,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
