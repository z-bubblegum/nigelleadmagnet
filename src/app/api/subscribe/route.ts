import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, payload } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const url = process.env.SUBSCRIBE_WEBHOOK_URL;
    if (!url) {
      return NextResponse.json({ ok: false, error: "Missing SUBSCRIBE_WEBHOOK_URL" }, { status: 500 });
    }

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, payload: payload ?? null, source: "prjct-zenith-calculator" }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}


