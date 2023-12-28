import React from "react";
import {CacheProvider} from "@emotion/react";
import {ThemeProvider, CssBaseline} from "@mui/material";
import createEmotionCache from "../src/libs/createEmotionCache";
import darkTheme from "../src/styles/theme/darkTheme";
import "../src/styles/globals.css";

const clientSideEmotionCache = createEmotionCache();

const MyApp = (props) => {
    const {Component, emotionCache = clientSideEmotionCache, pageProps} = props;

    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline/>
                <Component {...pageProps} />
            </ThemeProvider>
        </CacheProvider>
    );
};

export default MyApp;