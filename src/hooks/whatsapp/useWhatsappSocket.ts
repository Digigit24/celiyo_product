import { useEffect, useRef, useState } from 'react';
import { API_CONFIG } from '@/lib/apiConfig';

type SocketStatus = 'connecting' | 'open' | 'closed' | 'error';
type WsEventPayload = { event: string; data: any };

// Singleton state (module-scoped)
let ws: WebSocket | null = null;
let wsTenantId: string | null = null;
let heartbeatTimer: number | undefined;
let manualClose = false;
let retryAttempt = 0;

// Subscribers
const eventListeners = new Set<(payload: WsEventPayload) => void>();
const statusListeners = new Set<(status: SocketStatus) => void>();

const normalizePhone = (p?: string | null) => (p ? String(p).replace(/^\+/, '') : '');

const notifyEvent = (payload: WsEventPayload) => {
  eventListeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (err) {
      console.error('Listener error:', err);
    }
  });
};

const notifyStatus = (status: SocketStatus) => {
  statusListeners.forEach((cb) => {
    try {
      cb(status);
    } catch (err) {
      console.error('Status listener error:', err);
    }
  });
};

// Tenant utils (aligned with useMessages)
const getEnvTenantId = (): string | null => {
  // @ts-ignore
  return import.meta.env.VITE_TENANT_ID ?? null;
};

const readTenantId = (): string => {
  try {
    const userJson = localStorage.getItem('celiyo_user');
    if (userJson) {
      const u = JSON.parse(userJson);
      const t = u?.tenant;
      const tid = t?.id || t?.tenant_id;
      if (tid) return String(tid);
    }
  } catch {}
  return getEnvTenantId() || 'bc531d42-ac91-41df-817e-26c339af6b3a';
};

function startHeartbeat(sock: WebSocket) {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = window.setInterval(() => {
    try {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send('ping');
      }
    } catch {}
  }, 25000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
}

function scheduleReconnect(tenantId: string) {
  if (manualClose) return;
  retryAttempt = Math.min(retryAttempt + 1, 6);
  const delay = 500 * Math.pow(2, retryAttempt);
  console.log(`⏳ Reconnecting WhatsApp WebSocket in ${delay}ms (attempt ${retryAttempt})`);
  setTimeout(() => connect(tenantId), delay);
}

function parseAndDispatch(raw: unknown) {
  try {
    const handlePayload = (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      if (!payload.event || !payload.data) return;
      // Normalize common fields where possible
      const data = payload.data;
      if (data && data.phone) {
        data.phone = normalizePhone(data.phone);
      }
      notifyEvent(payload as WsEventPayload);
    };

    if (typeof raw === 'string') {
      const text = raw.trim();
      if (text === 'pong' || text === 'ping' || text === 'ok') return;
      if (!(text.startsWith('{') || text.startsWith('['))) {
        console.debug('↪️ Ignoring non-JSON WebSocket frame:', text.slice(0, 64));
        return;
      }
      handlePayload(JSON.parse(text));
    } else if (raw instanceof Blob) {
      (raw as Blob).text().then((t) => {
        try {
          const txt = t.trim();
          if (txt === 'pong' || txt === 'ping' || txt === 'ok') return;
          if (!(txt.startsWith('{') || txt.startsWith('['))) {
            console.debug('↪️ Ignoring non-JSON WebSocket blob frame');
            return;
          }
          const payload = JSON.parse(txt);
          handlePayload(payload);
        } catch {}
      });
    } else {
      console.debug('↪️ Ignoring unsupported WebSocket frame type:', typeof raw);
    }
  } catch (err) {
    console.error('❌ Failed to handle WebSocket message:', err);
  }
}

function connect(tenantId: string) {
  try {
    const wsUrl = `${API_CONFIG.WHATSAPP_WS_URL}/ws/${tenantId}`;
    console.log('🔌 Connecting persistent WhatsApp WebSocket:', wsUrl);

    wsTenantId = tenantId;
    manualClose = false;
    notifyStatus('connecting');

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WhatsApp WebSocket connected');
      retryAttempt = 0;
      notifyStatus('open');
      startHeartbeat(ws!);
    };

    ws.onmessage = (event) => {
      parseAndDispatch(event.data as unknown);
    };

    ws.onerror = (error) => {
      console.error('❌ WhatsApp WebSocket error:', error);
      try {
        ws?.close();
      } catch {}
      notifyStatus('error');
    };

    ws.onclose = (event) => {
      console.log('🔌 WhatsApp WebSocket closed:', event.code, event.reason);
      stopHeartbeat();
      notifyStatus('closed');
      ws = null;

      if (!manualClose && wsTenantId) {
        scheduleReconnect(wsTenantId);
      }
    };
  } catch (err) {
    console.error('❌ Failed to initialize WhatsApp WebSocket:', err);
    notifyStatus('error');
  }
}

function ensureSocket() {
  const tenantId = readTenantId();
  // Reuse existing socket if valid
  if (
    ws &&
    wsTenantId === tenantId &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  // Otherwise (re)connect
  if (ws) {
    manualClose = true;
    stopHeartbeat();
    try {
      ws.close();
    } catch {}
    ws = null;
  }
  connect(tenantId);
}

export function useWhatsappSocket() {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    ensureSocket();

    const statusCb = (s: SocketStatus) => {
      if (!mounted.current) return;
      setStatus(s);
    };
    statusListeners.add(statusCb);

    // Keep socket alive even if no components are listening; do not auto-close on unmount
    return () => {
      mounted.current = false;
      statusListeners.delete(statusCb);
      // We intentionally do NOT close the socket here to keep it persistent while on Chats page
    };
  }, []);

  const subscribe = (cb: (payload: WsEventPayload) => void) => {
    eventListeners.add(cb);
    return () => {
      eventListeners.delete(cb);
    };
  };

  const send = (payload: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
      } catch (e) {
        console.error('Failed to send over WebSocket:', e);
      }
    }
  };

  return {
    status,
    subscribe,
    send,
    readyState: ws?.readyState ?? WebSocket.CLOSED,
  };
}