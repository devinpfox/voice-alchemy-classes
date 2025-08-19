'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input } from '@/components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        alert(error.message)
        return
      }

      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      if (!user) {
        alert('Login succeeded but no user returned')
        return
      }

      let role: string | undefined =
        (user.user_metadata?.role as string | undefined)?.toLowerCase()

      if (!role) {
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (pErr && pErr.code !== 'PGRST116') {
          console.error('profiles fetch error:', pErr)
        }
        role = (profile?.role as string | undefined)?.toLowerCase()
      }

      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
<div className="w-full max-w-md">
  <Card>
    <CardBody className="transparent-goldboarder p-6">
      <h1 className="font-display text-3xl text-vaa-gold mb-6">Login</h1>

      <div className="space-y-3">
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full"
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) handleLogin();
          }}
          className="w-full"
        />

        <div className="flex items-center justify-between pt-1">
          <span />
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-vaa-gold hover:underline focus:underline"
            aria-label="Reset your password"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          onClick={handleLogin}
          className="w-full mt-2"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Log In"}
        </Button>
      </div>
    </CardBody>
  </Card>
</div>

  )
}
