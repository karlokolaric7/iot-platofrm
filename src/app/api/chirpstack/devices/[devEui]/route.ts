import { NextRequest, NextResponse } from "next/server";
import { chirpstack } from "@/lib/chirpstack";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ devEui: string }> }
) {
  try {
    const { devEui } = await params;
    const data = await chirpstack.getDevice(devEui);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`ChirpStack Single Device API Error (${(await params).devEui}):`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
