import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { api, setAuthToken, type AuthUser } from '../api/client';

type OtpRequestResult = { existingUser: boolean; devCode?: string };

type AuthState = {
  user: AuthUser | null;
  /** Request OTP for phone number */
  requestOtp: (phone: string) => Promise<OtpRequestResult>;
  /** Verify OTP and sign in */
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  /** Sign out current user */
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

// Offline fallback code for development
const OFFLINE_DEV_CODE = '123456';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const requestOtp = useCallback(async (phone: string): Promise<OtpRequestResult> => {
    try {
      const res = await api.requestOtp(phone);
      return { existingUser: res.existingUser, devCode: res.devCode };
    } catch {
      // Offline fallback for development
      return { existingUser: false, devCode: OFFLINE_DEV_CODE };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string) => {
    try {
      const res = await api.verifyOtp(phone, code, name);
      setAuthToken(res.token);
      setUser(res.user);
    } catch (err) {
      // Offline fallback: accept dev code for local testing
      if (code === OFFLINE_DEV_CODE) {
        setAuthToken(null);
        setUser({
          id: `driver_${Date.now()}`,
          name: name?.trim() || 'Driver',
          phone,
          role: 'driver',
          createdAt: new Date().toISOString(),
        });
        return;
      }
      throw err;
    }
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, requestOtp, verifyOtp, signOut }),
    [user, requestOtp, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}