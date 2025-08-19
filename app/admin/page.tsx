'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Student = { id: string; name: string | null }

export default function AdminPage() {
  const [students, setStudents] = useState<Student[] | null>(null)

  useEffect(() => {
    (async () => {
      // 1) Must be logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      // 2) Check role for THIS user
      const { data: me, error: meErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (meErr || me?.role !== 'admin') {
        // not an admin
        window.location.href = '/'
        return
      }

      // 3) Load students (admin can read all via RLS)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'student')
        .order('name', { ascending: true })

      if (error) { console.error(error); window.location.href = '/'; return }
      setStudents(data ?? [])
    })()
  }, [])

  if (!students) return <main className="p-8">Loading…</main>

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Students</h1>
      <ul className="space-y-2">
        {students.map(s => (
          <li key={s.id} className="border p-3 rounded flex items-center justify-between">
            <span>{s.name || '(no name)'}</span>
            <Link className="underline text-blue-600" href={`/admin/session/${s.id}`}>
              Open session
            </Link>
          </li>
        ))}
        {students.length === 0 && (
          <li className="text-sm text-gray-500">No students yet.</li>
        )}
      </ul>
    </main>
  )
}
