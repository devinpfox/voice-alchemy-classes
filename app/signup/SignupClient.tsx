'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    // 1) include name (and role) in auth metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'student' } },
    })

    if (error) {
      alert(error.message)
      return
    }

    // 2) If email confirmation is ON, no session yet — trigger will fill later
    if (!data.session) {
      alert('Check your email to confirm your account.')
      return
    }

    // 3) If confirmation is OFF, we have a session — upsert the profile now
    const userId = data.user?.id
    if (userId) {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert({ id: userId, name, role: 'student' }, { onConflict: 'id' })

      if (upsertErr) {
        console.error('Profile upsert error:', upsertErr)
        // optional: show a toast, but don’t block navigation
      }
    }

    router.push('/enter-class')
  }

  return (
    <main className="p-8 student-signup">
      <h1 className="text-xl mb-4">Student Signup</h1>
      <input className="border p-2 w-full mb-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleSignup} className="bg-blue-600 text-white px-4 py-2 rounded">Sign Up</button>
    </main>
  )
}
