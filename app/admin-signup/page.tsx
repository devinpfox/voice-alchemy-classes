'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    // If email confirmation is ON, they'll need to confirm then log in.
    if (!data.session) {
      alert('Check your email to confirm your account. After that, log in on /login.')
      return
    }

    // If confirmation is OFF, user is signed in now.
    router.push('/admin')
  }

  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Signup</h1>
      <input className="border p-2 w-full mb-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 w-full mb-4" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleSignup} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded">
        {loading ? 'Creating…' : 'Create Admin'}
      </button>
    </main>
  )
}
