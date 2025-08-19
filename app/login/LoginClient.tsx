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
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return alert(error.message)

      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      let role = (user?.user_metadata?.role as string | undefined)?.toLowerCase()

      if (!role && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        role = (profile?.role as string | undefined)?.toLowerCase()
      }

      router.push(role === 'admin' ? '/admin' : '/dashboard')
    } catch (e: any) {
      console.error(e)
      alert(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    // mobile: normal spacing + scroll; desktop: same centered 420px card
    <div className="w-full flex justify-center py-8 sm:py-20">
      <div className="w-full max-w-[420px] px-4 sm:px-0">
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleLogin() }}
                className="w-full"
              />

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-vaa-gold hover:underline focus:underline"
                  aria-label="Reset your password"
                >
                  Forgot password?
                </Link>
              </div>

              <Button onClick={handleLogin} className="w-full mt-1" disabled={loading}>
                {loading ? 'Signing in…' : 'Log In'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
