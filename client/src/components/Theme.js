import React from 'react';
import { ThemeProvider } from 'styled-components';

/**
 * Sets the customises theme for the application. 
 * 
 * There are 2 methods to customies the theme:
 * 1. Overriding less variables for antd. This is
 *    done in the `webpack.config.js` file
 * 2. Using `styled.components` ThemeProvider, 
 *    which is what is done here. The properties 
 *    within the `theme` object is accessible 
 *    via props in styled components.
 * 
 * This provides a centralised configuration 
 * location for the themes (in addition to 
 * `webpack.config.js`). 
 */
const theme = {
    colors: {
        powderPink: "#D6AFA6",
        deepRed: "#A41304",
        salmon: "#DD8779",
        marble: "#F3F2F0",
        black: "#0E0E0E",
        white: "FFFFFF",
        redGraphite: "#8B7E7E",
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