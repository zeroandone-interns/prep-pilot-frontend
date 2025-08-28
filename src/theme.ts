//theme.ts:
import { createTheme, responsiveFontSizes } from '@mui/material';

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

export default theme;
