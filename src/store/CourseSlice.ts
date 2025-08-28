import { createSlice,type PayloadAction } from "@reduxjs/toolkit";

interface CourseState {
  enrolled: boolean;
  title: string;
  description: string;
  level: string;
}

const initialState: CourseState = {
  enrolled: false,
  title: "",
  description: "",
  level: "",
};

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setCourse: (state, action: PayloadAction<CourseState>) => {
      return { ...state, ...action.payload };
    },
    clearCourse: () => initialState,
  },
});

export const { setCourse, clearCourse } = courseSlice.actions;
export default courseSlice.reducer;
