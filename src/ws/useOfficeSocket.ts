import { useEffect, useRef, useCallback, useState } from 'react';
import { env } from '../env';
import { useDeviceStore } from '../store/deviceStore';
import { useAlertStore } from '../store/alertStore';
import { usePowerStore } from '../store/powerStore';
import { AlertSchema } from '../types/alert';
import { PowerSummarySchema } from '../types/power';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface SocketMessage {
  type: string;
  payload: unknown;
}

export function useOfficeSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const updateDevice = useDeviceStore((state) => state.updateDevice);
  const addAlert = useAlertStore((state) => state.addAlert);
  const setPowerSummary = usePowerStore((state) => state.setPowerSummary);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(env.VITE_WS_URL);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setStatus('reconnecting');
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      setStatus('disconnected');
      scheduleReconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMessage = useCallback(
    (message: SocketMessage) => {
      const { type, payload } = message;

      switch (type) {
        case 'device_update': {
          const update = payload as { id: string; [key: string]: unknown };
          updateDevice(update.id, update);
          break;
        }
        case 'alert': {
          const result = AlertSchema.safeParse(payload);
          if (result.success) {
            addAlert(result.data);
          }
          break;
        }
        case 'power_update': {
          const result = PowerSummarySchema.safeParse(payload);
          if (result.success) {
            setPowerSummary(result.data);
          }
          break;
        }
      }
    },
    [updateDevice, addAlert, setPowerSummary]
  );

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      30000
    );

    reconnectAttemptsRef.current++;

    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    status,
    isConnected: status === 'connected',
  };
}

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(env.VITE_WS_URL);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = () => {
        setStatus('reconnecting');
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      setStatus('disconnected');
      scheduleReconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      30000
    );

    reconnectAttemptsRef.current++;

    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return status;
}
