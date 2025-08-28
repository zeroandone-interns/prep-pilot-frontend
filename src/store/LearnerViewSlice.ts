import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LearnerState {
  learner : boolean;
}

const initialState: LearnerState = {
  learner: false,
};

const LearnerSlice = createSlice({
  name: "Learner",
  initialState,
  reducers: {
    setLearner: (state, action: PayloadAction<LearnerState>) => {
      return { ...state, ...action.payload };
    },
    clearLearner: () => initialState,
  },
});

export const { setLearner, clearLearner } = LearnerSlice.actions;
export default LearnerSlice.reducer;
