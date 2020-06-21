import React from 'react';
import { ThemeProvider } from 'styled-components';

const theme = {
    colors: {
        powderPink: "#D6AFA6",
        deepRed: "#A41304",
        salmon: "#DD8779",
        marble: "#F3F2F0",
        black: "#0E0E0E"
    }
}

const ThemeWrapper = ({ children }) => {
    return (
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
    )
}

export default ThemeWrapper;