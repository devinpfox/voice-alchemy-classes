'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input } from '@/components/ui'
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

      // 1) get the signed-in user
      const { data: userRes } = await supabase.auth.getUser()
      const user = userRes?.user
      if (!user) {
        alert('Login succeeded but no user returned')
        return
      }

      // 2) prefer role from auth metadata
      let role: string | undefined =
        (user.user_metadata?.role as string | undefined)?.toLowerCase()

      // 3) fallback to profiles table if no metadata role
      if (!role) {
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (pErr && pErr.code !== 'PGRST116') {
          // ignore "no rows" but surface real errors
          console.error('profiles fetch error:', pErr)
        }
        role = (profile?.role as string | undefined)?.toLowerCase()
      }

      // 4) route by role
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
    <div className="grid place-items-center padding-20">
      <Card>
        <CardBody className="w-[420px] transparent-goldboarder">
          <h1 className="font-display text-3xl text-vaa-gold mb-6">Login</h1>
          <div className="space-y-3">
            <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <div className="spacer"></div>
            <Button onClick={handleLogin} className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Log In'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
