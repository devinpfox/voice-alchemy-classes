'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, { DailyCall, DailyEventObjectFatalError, DailyAdvancedOptions } from '@daily-co/daily-js';
import clsx from 'clsx';

type Props = {
  studentId: string;
  canJoin: boolean;
  className?: string;
  videoRef?: React.RefObject<HTMLDivElement | null>;
  isMiniPlayer?: boolean; // <-- ADDED PROP
};

export default function VideoDaily({ studentId, canJoin, className, videoRef, isMiniPlayer = false }: Props) {
  // Only used when no external videoRef is provided
  const internalRef = useRef<HTMLDivElement>(null);

  // DAILY CALL
  const callRef = useRef<DailyCall | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null); // <-- ADDED STATE
  const [isMeetingJoined, setIsMeetingJoined] = useState(false); // <-- ADDED STATE: Track if meeting is actually joined
  const currentRoomRef = useRef<string | null>(null);
  const initLockRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Mount target for Daily – ALWAYS the video-only div
  const mountTarget = videoRef ?? internalRef;

  // Effect to toggle UI chrome when mini-player state changes
  useEffect(() => {
    // Only proceed if callObject exists AND the meeting has actually been joined
    if (!callObject || !isMeetingJoined) return;

    // In mini-player mode, hide UI chrome. When not, show it again.
    callObject.setShowLocalVideo(!isMiniPlayer);
    callObject.setShowParticipantsBar(!isMiniPlayer);

  }, [isMiniPlayer, callObject, isMeetingJoined]); // <-- ADDED isMeetingJoined to dependency array

  useEffect(() => {
    let cancelled = false;

    const logTeardown = async () => {
      try {
        await callRef.current?.destroy();
      } catch {}
      callRef.current = null;
      currentRoomRef.current = null;
      setCallObject(null);
      setIsMeetingJoined(false); // <-- RESET STATE ON TEARDOWN
    };

    // If cannot join OR no mount target exists, teardown
    if (!canJoin || !mountTarget.current) {
      logTeardown();
      return;
    }

    // Strict mode double-run guard
    if (initLockRef.current) {
      // same student? do nothing
      if (currentRoomRef.current === studentId) return;

      // different student → teardown fully
      logTeardown();
    }
    initLockRef.current = true;

    (async () => {
      try {
        setError(null);
        setJoining(true);

        // 1) Request room + token
        const res = await fetch(`/api/rooms/${studentId}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!res.ok || json?.error || !json?.joinUrl || !json?.token) {
          throw new Error(json?.error || 'Failed to get room');
        }

        const { joinUrl, token } = json;
        currentRoomRef.current = studentId;

        if (cancelled) return;

        await logTeardown();

        // 2) Build Daily iframe directly inside the video-only element
        const element = mountTarget.current!;
        const url = `${joinUrl}?t=${token}`;

        const frame = DailyIframe.createFrame(element, {
          url,
          showLeaveButton: false,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '0.5rem',
          },
          dailyConfig: { logLevel: 'debug' },
        } as DailyAdvancedOptions);

        callRef.current = frame;
        setCallObject(frame); // <-- SET STATE FOR OTHER EFFECTS

        // Permissions
        const iframeEl = frame.iframe();
        if (iframeEl) {
          iframeEl.setAttribute(
            'allow',
            'camera; microphone; autoplay; clipboard-write; display-capture; fullscreen; picture-in-picture'
          );
        }

        frame.on('joined-meeting', () => { // <-- MODIFIED HANDLER
          setJoining(false);
          setIsMeetingJoined(true); // <-- SET STATE WHEN MEETING IS JOINED
        });
        frame.on('error', (e?: DailyEventObjectFatalError) => setError(e?.errorMsg || 'Call error'));

        // Timeout fallback
        const timeout = setTimeout(() => {
          setError('Connection timeout. Check mic/cam permissions.');
        }, 45000);

        try {
          await frame.join();
        } finally {
          clearTimeout(timeout);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Video failed to load');
      } finally {
        if (!cancelled) setJoining(false);
      }
    })();

    return () => {
      cancelled = true;

      setTimeout(() => {
        if (!document.body.contains(mountTarget.current as any)) {
          initLockRef.current = false;
          logTeardown();
        }
      }, 0);
    };
  }, [studentId, canJoin, mountTarget]);

  return (
    <div className={clsx('relative w-full h-full', className)}>
      {!canJoin ? (
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
          Video: Waiting for teacher…
        </div>
      ) : (
        <div className="relative w-full h-full">
          {/* 🚀 DAILY VIDEO SURFACE ONLY */}
          <div
            ref={mountTarget}
            className="w-full h-full overflow-hidden"
          />
        </div>
      )}
    </div>
  );
}
