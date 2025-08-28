import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LanguageState {
lang:string;
}

const initialState: LanguageState = {
  lang: "en"
};

const LanguageSlice = createSlice({
  name: "Language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<LanguageState>) => {
      return { ...state, ...action.payload };
    },
    clearLanguage: () => initialState,
  },
});

export const { setLanguage, clearLanguage } = LanguageSlice.actions;
export default LanguageSlice.reducer;
