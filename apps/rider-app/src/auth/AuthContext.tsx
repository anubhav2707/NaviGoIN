import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { api, setAuthToken, type AuthUser } from '../api/client';

type OtpRequestResult = { existingUser: boolean; devCode?: string };

type AuthState = {
  user: AuthUser | null;
  /** Ask the backend (or fall back offline) to send an OTP to this phone. */
  requestOtp: (phone: string) => Promise<OtpRequestResult>;
  /** Verify the OTP; creates the account on first login. */
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

// Universal dev code accepted by the offline fallback when the backend can't be
// reached (e.g. phone on client-isolated Wi-Fi). The real backend issues random codes.
const OFFLINE_DEV_CODE = '123456';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const requestOtp = useCallback(async (phone: string): Promise<OtpRequestResult> => {
    try {
      const res = await api.requestOtp(phone);
      return { existingUser: res.existingUser, devCode: res.devCode };
    } catch {
      // Backend unreachable — fall back to a local code so login still works on-device.
      return { existingUser: false, devCode: OFFLINE_DEV_CODE };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string, name?: string) => {
    try {
      const res = await api.verifyOtp(phone, code, name);
      setAuthToken(res.token);
      setUser(res.user);
    } catch (err) {
      // Offline fallback: accept the universal dev code and mint a local session.
      if (code === OFFLINE_DEV_CODE) {
        setAuthToken(null);
        setUser({
          id: `local_${Date.now()}`,
          name: name?.trim() || 'Rider',
          phone,
          role: 'rider',
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
