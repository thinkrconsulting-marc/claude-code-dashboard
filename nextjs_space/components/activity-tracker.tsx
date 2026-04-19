'use client';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function ActivityTracker() {
  const { data: session, status } = useSession() || {};
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>('');
  const heartbeatRef = useRef<any>(null);

  // Start session on mount
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    // Create a new session
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SESSION_START' }),
    })
      .then(r => r?.json?.())
      .then(d => {
        if (d?.sessionId) sessionIdRef.current = d.sessionId;
      })
      .catch(() => {});

    // Heartbeat every 60 seconds
    heartbeatRef.current = setInterval(() => {
      if (!sessionIdRef.current) return;
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'HEARTBEAT', sessionId: sessionIdRef.current }),
      }).catch(() => {});
    }, 60000);

    // End session on unmount
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (sessionIdRef.current) {
        navigator.sendBeacon?.(
          '/api/activity',
          JSON.stringify({ action: 'SESSION_END', sessionId: sessionIdRef.current })
        );
      }
    };
  }, [status, session?.user]);

  // Track page views
  useEffect(() => {
    if (status !== 'authenticated' || !pathname) return;
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Determine page name
    var pageName = pathname;

    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'PAGE_VIEW',
        page: pageName,
        sessionId: sessionIdRef.current,
      }),
    }).catch(() => {});
  }, [pathname, status]);

  return null; // Invisible component
}
