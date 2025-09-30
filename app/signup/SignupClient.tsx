'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !lastName || !email || !password) {
      alert('Please fill out all fields.')
      return
    }

    const fullName = `${firstName} ${lastName}`.trim()

    // ✅ Sign up and include metadata for the trigger
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          role: 'student',
        },
      },
    })

    if (error) {
      console.error('[Signup Error]', error)
      alert(`Signup failed: ${error.message}`)
      return
    }

    // If email confirmation is ON, there won't be a session yet.
    if (!data.session) {
      alert('Signup successful! Check your email to confirm your account.')
      return
    }

    // If confirmation is OFF and you do have a session, the trigger already
    // created the profile row. Just move on.
    router.push('/enter-class')
  }

  return (
    <main className="p-8 student-signup max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Student Signup</h1>
      <form onSubmit={handleSignup}>
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-4 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Sign Up
        </button>
      </form>
    </main>
  )
}
