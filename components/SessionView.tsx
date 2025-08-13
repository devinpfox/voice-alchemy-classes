'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import VideoDaily from './VideoDaily'

type Props = { studentId: string; isAdmin?: boolean }

export default function SessionView({ studentId, isAdmin = false }: Props) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [active, setActive] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [archive, setArchive] = useState<Array<{ id: string; class_started_at: string; class_ended_at: string }>>([])

  // Load current notes, session state, and archive list
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [{ data: n }, { data: s }, { data: a }] = await Promise.all([
        supabase.from('notes').select('content').eq('student_id', studentId).maybeSingle(),
        supabase.from('class_sessions').select('is_active, started_at').eq('student_id', studentId).maybeSingle(),
        supabase
          .from('notes_archive')
          .select('id, class_started_at, class_ended_at')
          .eq('student_id', studentId)
          .order('class_started_at', { ascending: false }),
      ])
      if (!mounted) return
      setNotes(n?.content ?? '')
      setActive(!!s?.is_active)
      setStartedAt(s?.started_at ? new Date(s.started_at) : null)
      setArchive(a ?? [])
    })()
    return () => { mounted = false }
  }, [studentId])

  // Realtime: reflect Start/End session in UI immediately
  useEffect(() => {
    const channel = supabase
      .channel(`class_sessions:${studentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_sessions', filter: `student_id=eq.${studentId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { is_active?: boolean; started_at?: string | null }
          if (row?.is_active !== undefined && row.is_active !== active) setActive(!!row.is_active)
          if (row?.started_at !== undefined) setStartedAt(row.started_at ? new Date(row.started_at) : null)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [studentId, active])

  // Autosave live notes (only if class is active)
  const save = useCallback(
    async (content: string) => {
      if (!active) return
      setSaving('saving')
      const { error } = await supabase.from('notes').upsert({ student_id: studentId, content })
      setSaving(error ? 'idle' : 'saved')
    },
    [studentId, active]
  )

  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => save(notes), 500)
    return () => clearTimeout(id)
  }, [notes, save, active])

  // Admin controls
  const startClass = async () => {
    await supabase.from('class_sessions').upsert({
      student_id: studentId, is_active: true, started_at: new Date().toISOString(), ended_at: null,
    })
    await supabase.from('notes').upsert({ student_id: studentId, content: '' })
    setNotes(''); setActive(true); setStartedAt(new Date())
  }

  const endClass = async () => {
    const ended = new Date()
    const { data: cur } = await supabase.from('notes').select('content').eq('student_id', studentId).maybeSingle()

    await supabase.from('notes_archive').insert({
      student_id: studentId,
      content: cur?.content ?? '',
      class_started_at: (startedAt ?? new Date()).toISOString(),
      class_ended_at: ended.toISOString(),
    })

    await supabase.from('class_sessions').upsert({
      student_id: studentId, is_active: false,
      started_at: startedAt?.toISOString() ?? null, ended_at: ended.toISOString(),
    })

    await supabase.from('notes').upsert({ student_id: studentId, content: '' })
    setActive(false); setStartedAt(null)

    const { data: a } = await supabase
      .from('notes_archive')
      .select('id, class_started_at, class_ended_at')
      .eq('student_id', studentId)
      .order('class_started_at', { ascending: false })
    setArchive(a ?? [])
  }

  return (

    <main className="p-6 max-w-5xl mx-auto grid gap-6">
      {/* VIDEO */}
      <section className="border rounded p-4">
  <div className="flex items-center justify-between mb-3">
    <div className="text-sm text-gray-500">Room</div>
    <code className="text-xs">{studentId}</code>
  </div>

  {/* Force full width & auto height */}
  <div className="w-full h-auto">
    <VideoDaily
      studentId={studentId}
      canJoin={active || isAdmin === true}
      className="w-full h-auto" // pass through to internal video element if supported
    />
  </div>

  {isAdmin ? (
    <div className="mt-4 flex gap-2">
      {!active ? (
        <button onClick={startClass} className="px-4 py-2 rounded bg-green-600 text-white">
          Start session
        </button>
      ) : (
        <button onClick={endClass} className="px-4 py-2 rounded bg-red-600 text-white">
          End session
        </button>
      )}
    </div>
  ) : (
    <p className="mt-3 text-sm text-gray-600">
      {active ? 'Class in session.' : 'Class not in session yet. You can view past notes below.'}
    </p>
  )}
</section>



      {/* NOTES (stacked under video) */}
      <section className="border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold mb-2">Notes</h2>
          {!active && <span className="text-xs text-gray-500">New note locked until class starts</span>}
        </div>

        <textarea
          className="w-full h-80 border rounded p-3"
          value={notes}
          readOnly={!active}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={active ? 'Type notes…' : 'Notes are locked until class starts.'}
        />
        <div className="text-sm text-gray-500 mt-1">
          {!active ? 'Read-only' : saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ' '}
        </div>

        {/* ARCHIVE */}
        <h3 className="font-semibold mt-6 mb-2">Past Classes</h3>
        <div className="divide-y border rounded">
          {archive.length === 0 && <div className="p-3 text-sm text-gray-500">No past classes yet.</div>}
          {archive.map((row) => {
            const title = new Date(row.class_started_at).toLocaleString()
            const subtitle = new Date(row.class_ended_at).toLocaleTimeString()
            return (
              <details key={row.id} className="p-3">
                <summary className="cursor-pointer">
                  {title} — ended {subtitle}
                </summary>
                <ArchivedContent id={row.id} />
              </details>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function ArchivedContent({ id }: { id: string }) {
  const [text, setText] = useState<string>('Loading…')
  useEffect(() => {
    let m = true
    supabase
      .from('notes_archive')
      .select('content')
      .eq('id', id)
      .single()
      .then(({ data }) => { if (m) setText(data?.content ?? '') })
    return () => { m = false }
  }, [id])
  return <pre className="whitespace-pre-wrap text-sm mt-3">{text}</pre>
}
