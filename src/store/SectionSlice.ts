import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SectionState {
  title_ar: string;
  title_en: string;
  title_fr: string;
}

const initialState: SectionState = {
  title_ar: "",
  title_en: "",
  title_fr: "",
};

const sectionSlice = createSlice({
  name: "section",
  initialState,
  reducers: {
    setSection: (state, action: PayloadAction<SectionState>) => {
      return { ...state, ...action.payload };
    },
    clearSection: () => initialState,
  },
});

export const { setSection, clearSection } = sectionSlice.actions;
export default sectionSlice.reducer;
