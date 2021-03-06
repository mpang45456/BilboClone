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
export const theme = {
    colors: {
        // Main Colour Scheme
        powderPink: "#D6AFA6",
        deepRed: "#A41304",
        salmon: "#DD8779",
        marble: "#F3F2F0",
        black: "#0E0E0E",
        white: "#FFFFFF",
        // Supplementary Colour Scheme
        darkRed: "#6b0501",
        darkerRed: '#570501',
        darkestRed: '#450401',
        brightRed: '#C93835',
        lightGrey: '#dbd2d0',
        defaultBlue: '#1890ff',
        highlighterYellow: '#ffc069',
        green: '#52c41a',
    },
    settings: {
        layoutHeaderHeight: '45px',
        headerIconFontSize: '20px',
    }
}

export const ThemeWrapper = ({ children }) => {
    return (
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
    )
}