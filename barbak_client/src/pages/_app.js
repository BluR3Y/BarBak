import GlobalStyles from "@/styles/Global";
import { useState } from "react";
import { ThemeProvider } from "styled-components";


export default function App({ Component, pageProps }) {
  const [activeTheme, setActiveTheme] = useState('classic');

  const siteThemes = {
    classic: {
      type: 'classic',
      primary: '#bf1313',
      secondary: '#ffffff',
      tertiary: '#bbc4c4',
      quaternary: '#41495a',
      background: '#fafafa'
    },
    dark: {
      type: 'dark',
      primary: '#bf1313',
      secondary: '#41495a',
      tertiary: '#bbc4c4',
      quaternary: '#ffffff',
      background: '#202634'
    }
  }

  return <ThemeProvider theme={siteThemes[activeTheme]}>
    <GlobalStyles/>
    <Component {...pageProps} />
  </ThemeProvider>;
}