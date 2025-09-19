'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import VideoDaily from './VideoDaily'

type Props = { studentId: string; isAdmin?: boolean }

export default function SessionView({ studentId, isAdmin = false }: Props) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [active, setActive] = useState(false)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [archive, setArchive] = useState<Array<{ id: string; class_started_at: string; class_ended_at: string }>>([])
  const [cssUrl, setCssUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') setCssUrl(`${window.location.origin}/daily-overrides.css`)
  }, [])

  const clientId = useMemo(() => crypto.randomUUID(), [])
  const lastLocalSaveAt = useRef<number>(0)
  const lastRemoteAt = useRef<number>(0)
  const [peersTyping, setPeersTyping] = useState<number>(0)
  const typingTimer = useRef<NodeJS.Timeout | null>(null)

  // Load current notes, session state, and archive
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

  // Realtime: class_sessions changes
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

  // realtime collaborative notes
  useEffect(() => {
    const ch = supabase.channel(`notes:${studentId}`, { config: { presence: { key: clientId } } })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, Array<{ typing?: boolean }>>
      const othersTyping = Object.entries(state)
        .filter(([key]) => key !== clientId)
        .flatMap(([, arr]) => arr)
        .filter(m => m.typing)
      setPeersTyping(othersTyping.length)
    })

    ch.on('broadcast', { event: 'note' }, (msg) => {
      const { content, from, ts } = msg.payload as { content: string; from: string; ts: number }
      if (from === clientId) return
      if (ts > lastRemoteAt.current) {
        lastRemoteAt.current = ts
        setNotes(content)
      }
    })

    ch.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return
      await ch.track({ typing: false })
    })

    return () => { supabase.removeChannel(ch) }
  }, [studentId, clientId])

  const broadcastNote = useCallback(
    (content: string) => {
      const ch = supabase.channel(`notes:${studentId}`)
      ch.send({ type: 'broadcast', event: 'note', payload: { content, from: clientId, ts: Date.now() } })
    },
    [studentId, clientId]
  )

  const setTyping = useCallback(
    (typing: boolean) => {
      const ch = supabase.channel(`notes:${studentId}`)
      ch.track({ typing }).catch(() => {})
    },
    [studentId]
  )

  const save = useCallback(
    async (content: string) => {
      if (!active) return
      setSaving('saving')
      const { error } = await supabase.from('notes').upsert({ student_id: studentId, content })
      if (!error) lastLocalSaveAt.current = Date.now()
      setSaving(error ? 'idle' : 'saved')
    },
    [studentId, active]
  )

  useEffect(() => {
    const ch = supabase
      .channel(`notes-db:${studentId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `student_id=eq.${studentId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { content?: string }
          if (typeof row?.content !== 'string') return
          const justSaved = Date.now() - lastLocalSaveAt.current < 800
          if (!justSaved) setNotes(row.content)
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [studentId])

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => save(notes), 500)
    return () => clearTimeout(t)
  }, [notes, save, active])

  const onChangeNotes = (v: string) => {
    setNotes(v)
    broadcastNote(v)
    setTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 1200)
  }

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
      published: true, // publish when ending session
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
      <section className="border rounded overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="text-sm text-gray-500">Room</div>
        </div>
        <div className="w-full h-auto">
          <VideoDaily
            studentId={studentId}
            canJoin={active || isAdmin === true}
            className="block"
          />
        </div>
        {isAdmin ? (
          <div className="p-4 border-t flex gap-2">
            {!active ? (
              <button onClick={startClass} className="px-4 py-2 rounded bg-green-600 text-white">Start session</button>
            ) : (
              <button onClick={endClass} className="px-4 py-2 rounded bg-red-600 text-white">End session</button>
            )}
          </div>
        ) : (
          <p className="p-4 text-sm text-gray-600 border-t">
            {active ? 'Class in session.' : 'Class not in session yet. You can view past notes below.'}
          </p>
        )}
      </section>

      <section className="border rounded p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold mb-2">Notes</h2>
          <div className="text-xs text-gray-500">
            {peersTyping > 0 ? `${peersTyping} ${peersTyping === 1 ? 'person is' : 'people are'} typing…` : (!active ? 'New note locked until class starts' : null)}
          </div>
        </div>
        <textarea
          className="w-full h-80 border rounded p-3"
          value={notes}
          readOnly={!active}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder={active ? 'Type notes…' : 'Notes are locked until class starts.'}
        />
        <div className="text-sm text-gray-500 mt-1">
          {!active ? 'Read-only' : saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ' '}
        </div>

        <h3 className="font-semibold mt-6 mb-2">Past Classes</h3>
        <div className="divide-y border rounded">
          {archive.length === 0 && <div className="p-3 text-sm text-gray-500">No past classes yet.</div>}
          {archive.map((row) => {
            const title = new Date(row.class_started_at).toLocaleString()
            const subtitle = new Date(row.class_ended_at).toLocaleTimeString()
            return (
              <details key={row.id} className="p-3">
                <summary className="cursor-pointer">{title} — ended {subtitle}</summary>
                <ArchivedEditable id={row.id} />
              </details>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function ArchivedEditable({ id }: { id: string }) {
  const [text, setText] = useState<string>('Loading…')
  const [original, setOriginal] = useState<string>('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [published, setPublished] = useState<boolean>(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [revisions, setRevisions] = useState<Array<{
    id: string; previous_content: string; new_content: string; edited_by: string|null; edited_at: string
  }> | null>(null)

  useEffect(() => {
    let on = true
    supabase
      .from('notes_archive')
      .select('content, published')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!on) return
        const c = data?.content ?? ''
        setText(c)
        setOriginal(c)
        setPublished(!!data?.published)
      })
    return () => { on = false }
  }, [id])

  useEffect(() => {
    if (!historyOpen) return
    let on = true
    supabase
      .from('notes_revisions')
      .select('id, previous_content, new_content, edited_by, edited_at')
      .eq('archive_id', id)
      .order('edited_at', { ascending: false })
      .then(({ data }) => { if (on) setRevisions(data ?? []) })
    return () => { on = false }
  }, [historyOpen, id])

  const onSave = async () => {
    setSaving('saving')
    const { error } = await supabase.from('notes_archive').update({ content: text }).eq('id', id)
    if (error) { setSaving('error'); return }
    setOriginal(text)
    setSaving('saved')
    setEditing(false)
    setTimeout(() => setSaving('idle'), 900)
  }

  const onCancel = () => {
    setText(original)
    setEditing(false)
    setSaving('idle')
  }

  return (
    <div className="mt-3 space-y-3">
      {!editing ? (
        <>
          <pre className="whitespace-pre-wrap text-sm">{text}</pre>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm"
              onClick={() => setHistoryOpen(v => !v)}
            >
              {historyOpen ? 'Hide Revisions' : 'Revision History'}
            </button>
            {published && <span className="text-xs text-amber-700">Published</span>}
          </div>
        </>
      ) : (
        <>
          <textarea
            className="w-full min-h-48 border rounded p-3 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm"
              onClick={onSave}
              disabled={saving === 'saving'}
            >
              {saving === 'saving' ? 'Saving…' : 'Save'}
            </button>
            <button
              className="px-3 py-1.5 rounded bg-gray-200 text-sm"
              onClick={onCancel}
              disabled={saving === 'saving'}
            >
              Cancel
            </button>
            <span className="text-xs text-gray-500">
              {saving === 'saved' ? 'Saved' : saving === 'error' ? 'Save failed' : ' '}
            </span>
          </div>
        </>
      )}

      {historyOpen && (
        <div className="border rounded p-3 bg-gray-50">
          {!revisions ? (
            <div className="text-sm text-gray-500">Loading history…</div>
          ) : revisions.length === 0 ? (
            <div className="text-sm text-gray-500">No revisions yet.</div>
          ) : (
            <ul className="space-y-3">
              {revisions.map((r) => (
                <li key={r.id} className="text-sm">
                  <div className="text-xs text-gray-500 mb-1">
                    Edited {new Date(r.edited_at).toLocaleString()}
                    {r.edited_by ? ` • by ${r.edited_by}` : ''}
                  </div>
                  <details className="rounded border bg-white">
                    <summary className="cursor-pointer p-2">View change</summary>
                    <div className="grid gap-2 p-2 md:grid-cols-2">
                      <div>
                        <div className="font-medium text-xs mb-1">Previous</div>
                        <pre className="whitespace-pre-wrap text-xs">{r.previous_content}</pre>
                      </div>
                      <div>
                        <div className="font-medium text-xs mb-1">New</div>
                        <pre className="whitespace-pre-wrap text-xs">{r.new_content}</pre>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
