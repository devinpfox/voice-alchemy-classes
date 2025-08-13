'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Card, CardBody, Button, Input } from '@/components/ui'

export default function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message)
    router.push('/admin')
  }

  return (
    <div className="grid place-items-center  padding-20">
      <Card>
        <CardBody className="w-[420px] transparent-goldboarder">
          <h1 className="font-display text-3xl text-vaa-gold mb-6">Login</h1>
          <div className="space-y-3">
            <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <div className="spacer"></div>
            <Button onClick={handleLogin} className="w-full mt-2">Log In</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
