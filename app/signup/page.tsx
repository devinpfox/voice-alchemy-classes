'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password })
  
    // TS-safe: only read .message if error exists
    if (error) {
      alert(error.message)
      return
    }
  
    // If email confirmation is ON, there’s no active session yet
    if (!data.session) {
      alert('Check your email to confirm your account.')
      // optional: router.push('/login')
      return
    }
  
    // If confirmation is OFF, user is signed in now
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
