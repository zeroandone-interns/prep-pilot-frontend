import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "react-redux";
import { store, persistor } from "./store"; // 👈 import persistor
import { PersistGate } from "redux-persist/integration/react"; // 👈 import PersistGate
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import theme from "./theme";
import { SnackbarProvider } from "./components/SnackbarProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {" "}
        {/* 👈 wrap App here */}
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
