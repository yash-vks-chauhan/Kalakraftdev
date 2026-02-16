import { NextResponse } from "next/server";
import pusher from "../../../../lib/pusher";
import prisma from "../../../../lib/prisma";
import { getAuthContext } from "../../../../lib/auth";

export async function POST(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Invalid auth payload" }, { status: 400 });
  }

  const match = channelName.match(/^private-support-ticket-(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ticketId = match[1];

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { email: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userEmail =
    auth.email ||
    (await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    }))?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.role !== "admin" && ticket.email !== userEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authResponse = await pusher.authorizeChannel(socketId, channelName);
  return NextResponse.json(authResponse);
}
