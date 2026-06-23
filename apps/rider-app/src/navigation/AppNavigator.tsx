import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../auth/AuthContext';
import AuthNavigator from './AuthNavigator';
import RootNavigator from './RootNavigator';

/**
 * Top-level gate: a single NavigationContainer that shows the login flow until
 * a user is signed in, then swaps to the authenticated app. Switching `user`
 * remounts the tree, so sign-out cleanly returns to the phone screen.
 */
export default function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {user ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
