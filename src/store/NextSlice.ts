import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NextState {
  SectionId: number;
  CourseId: number;
}

const initialState: NextState = {
  SectionId: 1,
  CourseId: 1 
};

const NextSlice = createSlice({
  name: "Next",
  initialState,
  reducers: {
    setNext: (state, action: PayloadAction<NextState>) => {
      return { ...state, ...action.payload };
    },
    clearNext: () => initialState,
  },
});

export const { setNext, clearNext } = NextSlice.actions;
export default NextSlice.reducer;
