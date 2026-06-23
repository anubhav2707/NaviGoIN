import { Platform } from 'react-native';

// The Go backend (apps/api) listens on :8080. On a physical device over Expo Go,
// "localhost" points at the phone, so we reach the backend one of two ways:
//   - BACKEND_TUNNEL: a public cloudflared URL, so the phone reaches it over the
//     internet even on a different Wi-Fi (set this when phone ≠ laptop network).
//   - LAN_HOST: the laptop's IP, for when phone and laptop share a network.
// Override either with EXPO_PUBLIC_API_URL.
const BACKEND_TUNNEL = '';
const LAN_HOST = '192.168.1.31';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (BACKEND_TUNNEL) return BACKEND_TUNNEL;
  if (Platform.OS === 'web') return 'http://localhost:8080';
  return `http://${LAN_HOST}:8080`;
}

const BASE_URL = resolveBaseUrl();

// Session token is attached to every request once the user logs in.
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  // Time out quickly so the UI can fall back when the backend is unreachable
  // (e.g. on a phone behind client-isolated Wi-Fi).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${BASE_URL}/v1${path}`, {
      headers,
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export type Point = { lat: number; lng: number };

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
};

export type FareEstimate = {
  vehicleType: string;
  fare: number;
  currency: string;
  surgeApplied: boolean;
};

export type Trip = {
  id: string;
  riderId: string;
  driverId?: string;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickup: Point;
  drop: Point;
};

// Build a ws(s):// URL for the realtime endpoint from the http(s) base.
export function realtimeTrackUrl(
  tripId: string,
  params: { plat: number; plng: number; dlat: number; dlng: number },
): string {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  const q = new URLSearchParams({
    plat: String(params.plat),
    plng: String(params.plng),
    dlat: String(params.dlat),
    dlng: String(params.dlng),
  }).toString();
  return `${wsBase}/v1/realtime/track/${tripId}?${q}`;
}

export const api = {
  baseUrl: BASE_URL,

  requestOtp(phone: string) {
    return request<{ otpSent: boolean; existingUser: boolean; devCode: string }>(
      '/identity/otp/request',
      { method: 'POST', body: JSON.stringify({ phone }) },
    );
  },

  verifyOtp(phone: string, code: string, name?: string) {
    return request<{ token: string; user: AuthUser }>('/identity/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    });
  },

  me() {
    return request<AuthUser>('/identity/me');
  },

  createPaymentOrder(amount: number, tripId?: string, riderId?: string) {
    return request<{
      chargeId: string;
      orderId: string;
      amount: number; // paise
      currency: string;
      keyId: string;
      mock?: boolean;
    }>('/payments/orders', {
      method: 'POST',
      body: JSON.stringify({ amount, tripId, riderId }),
    });
  },

  verifyPayment(params: {
    chargeId: string;
    orderId: string;
    paymentId: string;
    signature: string;
  }) {
    return request<{ id: string; status: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  chargeCash(tripId: string, riderId: string, amount: number) {
    return request<{ id: string; status: string }>('/payments/charges', {
      method: 'POST',
      body: JSON.stringify({ tripId, riderId, amount, method: 'cash' }),
    });
  },

  createUpiQr(amount: number, tripId?: string) {
    return request<{ upiUri: string; payeeVpa: string; amount: number; qrPngB64: string }>(
      '/payments/upi-qr',
      { method: 'POST', body: JSON.stringify({ amount, tripId }) },
    );
  },

  estimateFares(distanceKm: number, durationMin: number) {
    return request<{ estimates: FareEstimate[] }>('/pricing/estimate', {
      method: 'POST',
      body: JSON.stringify({ distanceKm, durationMin }),
    });
  },

  createTrip(riderId: string, pickup: Point, drop: Point) {
    return request<Trip>('/trips/', {
      method: 'POST',
      body: JSON.stringify({ riderId, pickup, drop }),
    });
  },

  updateTripStatus(tripId: string, status: Trip['status'], driverId?: string) {
    return request<Trip>(`/trips/${tripId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, driverId }),
    });
  },
};
