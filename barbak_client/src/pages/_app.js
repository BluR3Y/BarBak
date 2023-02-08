import GlobalStyles from "@/styles/Global";
import { useState } from "react";
import { ThemeProvider } from "styled-components";


export default function App({ Component, pageProps }) {
  const [activeTheme, setActiveTheme] = useState('classic');

  const siteThemes = {
    classic: {
      type: 'classic',
      primary: '#E55812',
      secondary: '#fafafa',
      tertiary: '#bbc4c4',
      quaternary: '#41495a',
    },
  }

  return <ThemeProvider theme={siteThemes[activeTheme]}>
    <GlobalStyles/>
    <Component {...pageProps} />
  </ThemeProvider>;
}