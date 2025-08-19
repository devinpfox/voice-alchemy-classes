'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import SessionView from '@/components/SessionView'
import TunerButton from "@/components/TunerButton";

export default function StudentSessionPage() {
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        window.location.href = '/login'; 
        return; 
      }
      setId(user.id)
    })()
  }, [])

  if (!id) return <main className="p-8">Loading…</main>

  return (
    <>
      <SessionView studentId={id} />
      <TunerButton />
    </>
  )
}