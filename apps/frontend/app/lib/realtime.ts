let socket: any = null;

export async function initRealtime() {
  if (typeof window === 'undefined') return null;
  if (socket) return socket;

  try {
    const { io } = await import('socket.io-client');
    const url = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    socket = io(url, { path: '/socket.io', transports: ['websocket'], autoConnect: true });
    return socket;
  } catch (err) {
    console.warn('Realtime init failed (socket.io-client missing):', err);
    return null;
  }
}

export async function subscribe(event: string, handler: (payload: any) => void) {
  const s = await initRealtime();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}

export async function emit(event: string, payload: any) {
  const s = await initRealtime();
  if (!s) return;
  s.emit(event, payload);
}
