import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface ModuleState {
  title_ar: string;
  title_en: string;
  title_fr: string;
}

const initialState: ModuleState = {
  title_ar: "",
  title_en: "",
  title_fr: "",
};

const moduleSlice = createSlice({
  name: "module",
  initialState,
  reducers: {
    setModule: (state, action: PayloadAction<ModuleState>) => {
      return { ...state, ...action.payload };
    },
    clearModule: () => initialState,
  },
});

export const { setModule, clearModule } = moduleSlice.actions;
export default moduleSlice.reducer;
