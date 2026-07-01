import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../auth/AuthContext';
import AuthNavigator from './AuthNavigator';
import RootNavigator from './RootNavigator';

/**
 * Top-level navigation controller that switches between auth and main app
 */
export default function AppNavigator() {
  const { user } = useAuth();
  
  return (
    <NavigationContainer>
      {user ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}