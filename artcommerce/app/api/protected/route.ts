// app/api/protected/route.ts
import { NextResponse } from "next/server"
import { adminAuth }     from "../../../lib/firebase-admin"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || ""
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const idToken = authHeader.replace("Bearer ", "")
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    return NextResponse.json({ ok: true, uid: decoded.uid, email: decoded.email })
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}