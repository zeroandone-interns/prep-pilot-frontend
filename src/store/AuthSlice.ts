// store/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  session: string | null;
  email: string | null;
}

const initialState: AuthState = {
  session: null,
  email:null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ session: string , email: string}>) => {
      state.session = action.payload.session;
      state.email= action.payload.email
    },
    clearAuth: (state) => {
      state.session = null;
      state.email = null ;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
