import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { CssBaseline, ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material'
import { Provider } from 'react-redux'
import { store } from './store'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'

let theme = createTheme({
  palette: {
    primary: { main: '#0A192F' },   // Almost-black navy
    secondary: { main: '#64FFDA' }
  },
  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: ({ theme }) => ({
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }),
      },
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: ({ theme }) => ({
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: '#fff',
            '&:hover': { filter: 'brightness(0.95)' },
          }),
        },
      ],
    },
    MuiContainer: {
      defaultProps: { maxWidth: 'lg' }
    },
  },
});
theme = responsiveFontSizes(theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
)
