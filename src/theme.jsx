import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6BA65F', // your desired primary color (blue)
    },
    secondary: {
      main: '#7C4848', // your desired secondary color (purple)
    },
    background: {
      default: '#fefaf5' // optional: global background color
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif', // or your preferred font
  },
});

export default theme;