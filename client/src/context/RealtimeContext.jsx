import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const RealtimeContext = createContext();

// Synthetic gentle chime using Web Audio API
const playChime = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    } else if (type === 'notification') {
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    } else {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2); // E5
    }

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio might be blocked if no user interaction yet, ignore safely
  }
};

export const RealtimeProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(() => navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('lostlink_sound_enabled') !== 'false';
  });
  const [liveNotification, setLiveNotification] = useState(null);
  const channelRef = useRef(null);
  const listenersRef = useRef(new Set());
  const syncInProgressRef = useRef(false);

  // Save sound setting
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('lostlink_sound_enabled', String(next));
      if (next) playChime('notification');
      return next;
    });
  };

  // Broadcast and local dispatch
  const emitRealtimeEvent = useCallback((type, data = {}) => {
    const eventPayload = {
      type,
      data,
      senderId: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };

    setLastSyncTime(new Date());

    // 1. Send to other open browser tabs/windows
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(eventPayload);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. Dispatch local event for components in this tab
    listenersRef.current.forEach((listener) => {
      try {
        listener(eventPayload);
      } catch (e) {
        console.error('Listener callback error:', e);
      }
    });

    // 3. Dispatch to window
    window.dispatchEvent(new CustomEvent('lostlink:realtime', { detail: eventPayload }));
  }, []);

  // Subscribe to real-time events
  const subscribe = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  // Initialize BroadcastChannel
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('lostlink_realtime_channel');
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const payload = event.data;
        if (!payload) return;

        setLastSyncTime(new Date());

        // Play gentle audio if enabled
        if (soundEnabled) {
          playChime(payload.type?.includes('CLAIM') ? 'notification' : 'success');
        }

        // Show a live notification pill
        if (payload.type === 'ITEM_CREATED') {
          const item = payload.data || {};
          setLiveNotification({
            id: Date.now(),
            title: `New ${item.type === 'lost' ? 'Lost' : 'Found'} Item Listed`,
            message: `${item.title || 'An item'} was just reported in real-time.`,
            type: item.type === 'lost' ? 'rose' : 'emerald'
          });
        } else if (payload.type === 'CLAIM_UPDATED') {
          const claim = payload.data || {};
          setLiveNotification({
            id: Date.now(),
            title: `Claim ${claim.status || 'Updated'}`,
            message: `A verification claim was just ${claim.status || 'updated'} in real-time.`,
            type: claim.status === 'approved' ? 'emerald' : 'rose'
          });
        } else if (payload.type === 'CLAIM_CREATED') {
          setLiveNotification({
            id: Date.now(),
            title: 'New Claim Received',
            message: 'An ownership verification claim was just submitted in real-time.',
            type: 'blue'
          });
        }

        // Notify local subscribers
        listenersRef.current.forEach((listener) => {
          try {
            listener(payload);
          } catch (e) {
            console.error('Listener error on cross-tab message:', e);
          }
        });
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to window events only:', e);
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [soundEnabled]);

  // Refresh active views so changes made on other devices appear promptly.
  useEffect(() => {
    const syncActiveViews = async () => {
      if (!navigator.onLine) {
        setIsLive(false);
        return;
      }
      if (document.visibilityState === 'hidden' || syncInProgressRef.current) return;

      syncInProgressRef.current = true;
      try {
        await api.get('/health', { timeout: 4000 });
        if (!navigator.onLine) {
          setIsLive(false);
          return;
        }

        setIsLive(true);
        const timestamp = new Date();
        setLastSyncTime(timestamp);
        listenersRef.current.forEach((listener) => {
          try {
            listener({ type: 'HEARTBEAT_SYNC', timestamp: timestamp.toISOString() });
          } catch (e) {
            // Ignore individual subscriber failures.
          }
        });
      } catch (e) {
        setIsLive(false);
      } finally {
        syncInProgressRef.current = false;
      }
    };

    const handleOnline = () => {
      setIsLive(true);
      syncActiveViews();
    };
    const handleOffline = () => setIsLive(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncActiveViews();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    syncActiveViews();
    const interval = setInterval(() => {
      syncActiveViews();
    }, 5000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Manual refresh trigger
  const forceSync = useCallback(() => {
    setLastSyncTime(new Date());
    if (soundEnabled) playChime('notification');
    emitRealtimeEvent('MANUAL_SYNC', { triggeredBy: 'user' });
  }, [emitRealtimeEvent, soundEnabled]);

  return (
    <RealtimeContext.Provider
      value={{
        isLive,
        lastSyncTime,
        soundEnabled,
        toggleSound,
        emitRealtimeEvent,
        subscribe,
        forceSync,
        liveNotification,
        clearLiveNotification: () => setLiveNotification(null)
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
