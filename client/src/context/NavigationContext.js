import { createContext, useContext } from 'react';

// App-wide Navigation Context
export const NavigationContext = createContext();

// Hook to use the Context and gain access to variables set by Provider
export function useNavigation() {
    return useContext(NavigationContext);
}