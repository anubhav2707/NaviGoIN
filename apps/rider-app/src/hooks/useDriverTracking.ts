import { useEffect, useRef, useState } from 'react';

import { realtimeTrackUrl } from '../api/client';
import type { Point } from '../navigation/types';

export type TrackPhase = 'connecting' | 'arriving' | 'arrived' | 'on_trip' | 'completed' | 'offline';

export type DriverTracking = {
  phase: TrackPhase;
  progress: number; // 0..1 within the current leg
  etaMin: number;
  lat: number | null;
  lng: number | null;
  bearing: number;
  connected: boolean;
};

const INITIAL: DriverTracking = {
  phase: 'connecting',
  progress: 0,
  etaMin: 0,
  lat: null,
  lng: null,
  bearing: 0,
  connected: false,
};

/**
 * Subscribes to the backend's live trip telemetry over WebSocket. Falls back to
 * an "offline" phase if the socket can't connect (e.g. backend unreachable), so
 * the screen still renders sensible static content.
 */
export function useDriverTracking(
  tripId: string | undefined,
  pickup: Point,
  drop: Point,
): DriverTracking {
  const [state, setState] = useState<DriverTracking>(INITIAL);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!tripId) {
      setState((s) => ({ ...s, phase: 'offline' }));
      return;
    }

    let closedByUs = false;
    const url = realtimeTrackUrl(tripId, {
      plat: pickup.lat,
      plng: pickup.lng,
      dlat: drop.lat,
      dlng: drop.lng,
    });

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setState((s) => ({ ...s, phase: 'offline' }));
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => setState((s) => ({ ...s, connected: true }));
    ws.onmessage = (event) => {
      try {
        const u = JSON.parse(event.data as string);
        setState({
          phase: u.phase,
          progress: typeof u.progress === 'number' ? u.progress : 0,
          etaMin: u.etaMin ?? 0,
          lat: u.lat ?? null,
          lng: u.lng ?? null,
          bearing: u.bearing ?? 0,
          connected: true,
        });
      } catch {
        /* ignore malformed frames */
      }
    };
    ws.onerror = () => {
      if (!closedByUs) setState((s) => ({ ...s, phase: s.connected ? s.phase : 'offline' }));
    };
    ws.onclose = () => {
      if (!closedByUs) setState((s) => ({ ...s, connected: false }));
    };

    return () => {
      closedByUs = true;
      ws.close();
      wsRef.current = null;
    };
    // Re-subscribe only when the trip changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  return state;
}
