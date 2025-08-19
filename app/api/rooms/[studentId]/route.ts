// app/api/rooms/[studentId]/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const DAILY_API = "https://api.daily.co/v1";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ studentId: string }> } // Next 15: params is a Promise
) {
  const { studentId } = await ctx.params;
  const roomName = studentId;

  const headers = {
    Authorization: `Bearer ${process.env.DAILY_API_KEY!}`,
    "Content-Type": "application/json",
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60; // 1 hour

  // 1) Ensure room exists: GET → if 404 create → else maybe update exp
  let r = await fetch(`${DAILY_API}/rooms/${roomName}`, { headers, cache: "no-store" });

  if (r.status === 404) {
    // --- create (idempotent) ---
    const create = await fetch(`${DAILY_API}/rooms`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: { eject_at_room_exp: true, exp },
      }),
      cache: "no-store",
    });

    if (!create.ok) {
      // tolerate races: "already exists" is fine
      const status = create.status;
      const bodyText = await create.text().catch(() => "");
      let alreadyExists = false;
      try {
        const j = JSON.parse(bodyText);
        alreadyExists =
          j?.info?.toString()?.includes("already exists") ||
          j?.error?.toString()?.includes("already exists");
      } catch {}
      if (!(status === 409 || alreadyExists)) {
        return NextResponse.json({ error: bodyText || "Room create failed" }, { status: 500 });
      }
      // else: proceed
    }
  } else if (r.ok) {
    const existing = await r.json().catch(() => null);
    const currentExp =
      existing?.config?.properties?.exp ??
      existing?.properties?.exp ??
      0;

    if (!currentExp || currentExp < now + 60) {
      // POST /rooms/{name} updates properties
      const update = await fetch(`${DAILY_API}/rooms/${roomName}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          privacy: "private",
          properties: { eject_at_room_exp: true, exp },
        }),
        cache: "no-store",
      });
      if (!update.ok) {
        return NextResponse.json({ error: await update.text() }, { status: 500 });
      }
    }
  } else {
    return NextResponse.json({ error: await r.text() }, { status: 500 });
  }

  // 2) Re-read to get URL
  const roomRes = await fetch(`${DAILY_API}/rooms/${roomName}`, { headers, cache: "no-store" });
  if (!roomRes.ok) return NextResponse.json({ error: await roomRes.text() }, { status: 500 });
  const room = await roomRes.json();
  const joinUrl: string | undefined = room?.url;
  if (!joinUrl) return NextResponse.json({ error: "Room URL missing" }, { status: 500 });

  // 3) Mint a meeting token
  const tokRes = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: true,           // set false for students if you want
        user_name: "Session user",
        exp,
      },
    }),
    cache: "no-store",
  });
  if (!tokRes.ok) return NextResponse.json({ error: await tokRes.text() }, { status: 500 });
  const { token } = await tokRes.json();

  return NextResponse.json({ joinUrl, token });
}
