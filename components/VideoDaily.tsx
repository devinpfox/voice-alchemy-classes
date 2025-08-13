'use client'

import { useEffect, useRef, useState } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'

type Props = {
  studentId: string
  canJoin: boolean
  className?: string
}

export default function VideoDaily({ studentId, canJoin }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const callRef = useRef<DailyCall | null>(null)
  const [error, setError] = useState<string | null>(null)

useEffect(() => {
  // If canJoin just turned false, kill existing instance immediately
  if (!canJoin && callRef.current) {
    callRef.current.destroy()
    callRef.current = null
    return
  }

  // Don't create if can't join
  if (!canJoin) return

  // Don't create if already have one
  if (callRef.current) return

  if (!containerRef.current) return

  const setupDaily = async () => {
    try {
      const res = await fetch(`/api/rooms/${studentId}`)
      if (!res.ok) {
        setError(await res.text())
        return
      }
      const { joinUrl } = await res.json()

      const frame = DailyIframe.createFrame(containerRef.current as HTMLElement, {
        showLeaveButton: true,
        iframeStyle: { width: '100%', height: '100%', border: '0', borderRadius: '0.5rem' },
      })

      callRef.current = frame

      frame.on('left-meeting', () => {
        frame.destroy()
        callRef.current = null
      })

      await frame.join({ url: joinUrl })
    } catch (e: any) {
      setError(e?.message || 'Video failed to load')
    }
  }

  setupDaily()

  // Cleanup on unmount
  return () => {
    if (callRef.current) {
      callRef.current.destroy()
      callRef.current = null
    }
  }
}, [studentId, canJoin])


  return (
    <div className="h-64 border rounded overflow-hidden relative">
      {!canJoin ? (
        <div className="h-full flex items-center justify-center text-sm text-gray-600">
          Video: Waiting for teacher
        </div>
      ) : (
        <>
          <div ref={containerRef} className="w-full h-full" />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-600 text-sm">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
