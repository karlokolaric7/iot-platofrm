import { NextRequest, NextResponse } from "next/server";
import { chirpstack } from "@/lib/chirpstack";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const data = await chirpstack.getGateways(limit, offset);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("ChirpStack Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
