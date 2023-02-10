import GlobalStyles from "@/styles/Global";
import { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { siteThemes } from "@/styles/utils/themes";

export default function App({ Component, pageProps }) {
  const [activeTheme, setActiveTheme] = useState('classic');

  useEffect(() => {
    const preferedColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    setActiveTheme(preferedColorScheme.matches ? 'dark' : 'classic');

    preferedColorScheme.addEventListener('change', changeColorScheme);

    // Remove listener
    return () => {
      preferedColorScheme.removeEventListener('change', () => {});
    }
  },[]);

  const changeColorScheme = (event) => {
    setActiveTheme(event.matches ? 'dark' : 'classic');
  }

  return <ThemeProvider theme={siteThemes[activeTheme]}>
    <GlobalStyles/>
    <Component {...pageProps} />
  </ThemeProvider>;
}