import GlobalStyles from "@/styles/Global";
import { useState } from "react";
import { ThemeProvider } from "styled-components";
import { siteThemes } from "@/styles/utils/themes";

export default function App({ Component, pageProps }) {
  const [activeTheme, setActiveTheme] = useState('classic');

  return <ThemeProvider theme={siteThemes[activeTheme]}>
    <GlobalStyles/>
    <Component {...pageProps} />
  </ThemeProvider>;
}