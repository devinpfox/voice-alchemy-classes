// app/api/rooms/[studentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ studentId: string }> }   // 👈 note Promise
) {
  const { studentId } = await ctx.params            // 👈 await it

  const key = process.env.DAILY_API_KEY
  if (!key) return NextResponse.json({ error: 'Missing DAILY_API_KEY' }, { status: 500 })

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const DAILY_BASE = 'https://api.daily.co/v1'

  // try to get the room by name
  let r = await fetch(`${DAILY_BASE}/rooms/${studentId}`, { headers })
  let room: any
  if (r.ok) {
    room = await r.json()
  } else {
    // create if missing
    r = await fetch(`${DAILY_BASE}/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: studentId,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    })
    if (!r.ok) {
      const t = await r.text()
      return NextResponse.json({ error: t }, { status: r.status })
    }
    room = await r.json()
  }

  // create meeting token
  const tokenRes = await fetch(`${DAILY_BASE}/meeting-tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      properties: {
        room_name: room.name,
        exp: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
      },
    }),
  })
  if (!tokenRes.ok) {
    const t = await tokenRes.text()
    return NextResponse.json({ error: t }, { status: tokenRes.status })
  }
  const token = await tokenRes.json()

  const joinUrl = `${room.url}?t=${token.token}`
  return NextResponse.json({ joinUrl })
}
