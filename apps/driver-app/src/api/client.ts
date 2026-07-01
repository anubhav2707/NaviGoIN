import Constants from 'expo-constants';

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  role: 'driver';
  createdAt: string;
  vehicleNumber?: string;
  vehicleType?: 'auto' | 'sedan' | 'suv';
};

type ApiClient = {
  requestOtp: (phone: string) => Promise<{ existingUser: boolean; devCode?: string }>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<{ token: string; user: AuthUser }>;
  getProfile: () => Promise<AuthUser>;
  updateProfile: (data: Partial<AuthUser>) => Promise<AuthUser>;
  getEarnings: (date?: string) => Promise<{ total: number; trips: number; online_hours: number }>;
  getTripRequests: () => Promise<any[]>;
  acceptTrip: (tripId: string) => Promise<any>;
  completeTrip: (tripId: string) => Promise<any>;
};

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function resolveBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
  if (!url) return 'http://localhost:8080';
  return url;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export const api: ApiClient = {
  requestOtp: (phone: string) => 
    request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, role: 'driver' }),
    }),
    
  verifyOtp: (phone: string, code: string, name?: string) =>
    request('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name, role: 'driver' }),
    }),
    
  getProfile: () => request('/driver/profile'),
  
  updateProfile: (data: Partial<AuthUser>) =>
    request('/driver/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  getEarnings: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return request(`/driver/earnings${params}`);
  },
  
  getTripRequests: () => request('/driver/trips/requests'),
  
  acceptTrip: (tripId: string) =>
    request(`/driver/trips/${tripId}/accept`, { method: 'POST' }),
    
  completeTrip: (tripId: string) =>
    request(`/driver/trips/${tripId}/complete`, { method: 'POST' }),
};