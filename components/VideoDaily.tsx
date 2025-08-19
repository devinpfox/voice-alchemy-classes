'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import clsx from 'clsx';


type Props = { studentId: string; canJoin: boolean; className?: string };

export default function VideoDaily({ studentId, canJoin, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const initLockRef = useRef<boolean>(false); // Strict-mode guard

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const log = (l: string, d?: any) => console.log(`[daily] ${l}`, d ?? '');

    const teardown = async () => {
      try {
        await callRef.current?.destroy();
      } catch {}
      callRef.current = null;
      currentRoomRef.current = null;
    };

    // If we can't (or shouldn't) show video, clean up and bail
    if (!canJoin || !containerRef.current) {
      teardown();
      return;
    }

    // Strict-mode: prevent duplicate init on the first pass
    if (initLockRef.current) {
      // If same room, do nothing; if different room, rebuild
      if (currentRoomRef.current === studentId) return;
      // different studentId → rebuild
      teardown();
    }
    initLockRef.current = true;

    (async () => {
      try {
        setError(null);
        setJoining(true);

        // 1) Get room + token
        const res = await fetch(`/api/rooms/${studentId}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!res.ok || json?.error || !json?.joinUrl || !json?.token) {
          throw new Error(json?.error || 'Failed to get room');
        }
        const { joinUrl, token } = json;
        currentRoomRef.current = studentId;

        if (cancelled) return;

        // 2) Build the iframe only once
        await teardown(); // ensure no stray frame

        const el = containerRef.current!;
        const urlWithToken = `${joinUrl}?t=${token}`; // same URL you tested in a new tab
        
        const frame = DailyIframe.createFrame(el, {
          url: urlWithToken,             // ← load the same URL as the direct link
          showLeaveButton: true,
          iframeStyle: { width: '100%', height: '100%', border: '0', borderRadius: '0.5rem' },
          dailyConfig: { logLevel: 'debug' },
        } as any);
        
        callRef.current = frame;
        
        // Give the iframe permissions before joining
        const iframeEl = typeof (frame as any).iframe === 'function' ? frame.iframe() as HTMLIFrameElement : null;
        if (iframeEl) {
          iframeEl.setAttribute(
            'allow',
            'camera; microphone; autoplay; clipboard-write; display-capture; fullscreen; picture-in-picture'
          );
        }
        
        // Helpful logs
        frame.on('loaded', () => console.log('[daily] loaded'));
        frame.on('joining-meeting', () => console.log('[daily] joining-meeting'));
        frame.on('joined-meeting', () => { console.log('[daily] joined-meeting'); setJoining(false); });
        frame.on('error' as any, (e:any) => { console.log('[daily] error', e); setError(e?.errorMsg || 'Call error'); });
        frame.on('fatal-error' as any, (e:any) => { console.log('[daily] fatal', e); setError(e?.errorMsg || 'Fatal'); });
        
        const timeout = setTimeout(() => {
          setError('Connection timed out. Refresh or check permissions.');
        }, 45000);
        
        try {
          await frame.join();            // token already in URL
        } finally {
          clearTimeout(timeout);
        }
        
      } catch (e: any) {
        if (!cancelled) {
          console.error('[daily] join failed', e);
          setError(e?.message || 'Video failed to load');
        }
      } finally {
        if (!cancelled) setJoining(false);
      }
    })();

    // Real unmount cleanup only (Strict-mode safe)
    return () => {
      cancelled = true;
      // Delay to avoid Strict-mode first-pass cleanup killing the fresh join
      setTimeout(() => {
        if (!document.body.contains(containerRef.current as any)) {
          initLockRef.current = false;
          teardown();
        }
      }, 0);
    };
  }, [studentId, canJoin]);

  return (
    <div className={clsx('relative w-full overflow-hidden', className)}>
      {!canJoin ? (
        <div className="w-full aspect-video flex items-center justify-center text-sm text-gray-400">
          Video: Waiting for teacher
        </div>
      ) : (
        <>
          <div ref={containerRef} className="w-full aspect-video" />
          {/* overlays removed for testing */}
        </>
      )}
    </div>
  );
}
