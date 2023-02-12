import GlobalStyles from "@/styles/Global";
import { useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { siteThemes } from "@/styles/utils/themes";

// React Redux Imports
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import { Provider } from "react-redux";

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

  return <Provider store={store}>
    <PersistGate loading={<h1>Loading...</h1>} persistor={persistor}>
      <ThemeProvider theme={siteThemes[activeTheme]}>
        <GlobalStyles/>
        <Component {...pageProps} />
      </ThemeProvider>
    </PersistGate>
  </Provider>
}