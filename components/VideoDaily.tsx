'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe, {
  DailyCall,
  DailyEventObjectFatalError,
} from '@daily-co/daily-js';
import clsx from 'clsx';

type Props = {
  studentId: string;
  canJoin: boolean;
  className?: string;
  isMiniPlayer?: boolean;
};

export default function VideoDaily({
  studentId,
  canJoin,
  className,
  isMiniPlayer = false,
}: Props) {
  // Container where Daily Prebuilt iframe will be mounted
  const internalRef = useRef<HTMLDivElement>(null);
  const mountTarget = internalRef;

  // Daily call state
  const callRef = useRef<DailyCall | null>(null);
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [isMeetingJoined, setIsMeetingJoined] = useState(false);

  const currentRoomUrlRef = useRef<string | null>(null);
  const initLockRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  /**
   * Create + join Daily Prebuilt when we can join
   */
  useEffect(() => {
    let cancelled = false;

    const teardown = async () => {
      try {
        await callRef.current?.destroy();
      } catch {
        // ignore
      }
      callRef.current = null;
      setCallObject(null);
      setIsMeetingJoined(false);
    };

    if (!canJoin || !mountTarget.current) {
      teardown();
      return;
    }

    // React strict mode guard: only recreate if studentId changes
    if (initLockRef.current) {
      // same student, do nothing
      if (currentRoomUrlRef.current && currentRoomUrlRef.current.includes(studentId)) {
        return;
      }
      // different student → full teardown
      teardown();
    }

    initLockRef.current = true;

    (async () => {
      try {
        setError(null);
        setJoining(true);

        // 1) Get room URL + token for this student
        const res = await fetch(`/api/rooms/${studentId}`, { cache: 'no-store' });
        const json = await res.json().catch(() => null);

        if (!res.ok || json?.error || !json?.joinUrl || !json?.token) {
          throw new Error(json?.error || 'Failed to get Daily room.');
        }

        const { joinUrl, token } = json;
        currentRoomUrlRef.current = joinUrl;

        if (cancelled) return;

        await teardown();

        // 2) Create the Prebuilt iframe
        const frame = DailyIframe.createFrame(mountTarget.current!, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '0.5rem',
          },
        });

        callRef.current = frame;
        setCallObject(frame);

        const iframeEl = frame.iframe();
        if (iframeEl) {
          iframeEl.setAttribute(
            'allow',
            'camera; microphone; autoplay; clipboard-write; display-capture; fullscreen; picture-in-picture',
          );
        }

        // 3) Wire up events
        frame.on('joined-meeting', () => {
          setJoining(false);
          setIsMeetingJoined(true);
        });

        frame.on('error', (e?: DailyEventObjectFatalError) => {
          setError(e?.errorMsg || 'Call error');
        });

        // 4) Join the room
        await frame.join({
          url: `${joinUrl}?t=${token}`,
          showLeaveButton: true,
          // initial UI; will be adjusted again by the mini-player effect
          showLocalVideo: true,
          showParticipantsBar: true,
        });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Video failed to load.');
      } finally {
        if (!cancelled) setJoining(false);
      }
    })();

    return () => {
      cancelled = true;

      // defer so React can unmount the node first
      setTimeout(() => {
        if (!document.body.contains(mountTarget.current as any)) {
          initLockRef.current = false;
          teardown();
        }
      }, 0);
    };
  }, [studentId, canJoin]);

  /**
   * When mini-player state changes, toggle certain UI pieces
   * (Only possible for things Daily exposes: local self-view + participants bar)
   */
  useEffect(() => {
    if (!callObject || !isMeetingJoined) return;

    if (isMiniPlayer) {
      // In mini-player: hide local preview + participants bar
      callObject.setShowLocalVideo(false);
      callObject.setShowParticipantsBar(false);
    } else {
      // Full view: restore them
      callObject.setShowLocalVideo(true);
      callObject.setShowParticipantsBar(true);
    }
  }, [isMiniPlayer, callObject, isMeetingJoined]);

  return (
    <div className={clsx('relative w-full h-full', className)}>
      {!canJoin ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
          Video: Waiting for teacher…
        </div>
      ) : (
        <div className="relative h-full w-full">
          {/* Daily Prebuilt iframe mounts here */}
          <div ref={mountTarget} className="h-full w-full overflow-hidden" />

          {/* Optional tiny status text in case you want it */}
          {joining && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center text-xs text-gray-300">
              Connecting to room…
            </div>
          )}
          {error && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center text-xs text-red-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
