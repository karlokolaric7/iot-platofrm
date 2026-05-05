import { NextRequest, NextResponse } from "next/server";
import { chirpstack } from "@/lib/chirpstack";
import { getProvisioningContext } from "@/lib/chirpstack-provisioning";

export async function GET(req: NextRequest) {
  try {
    const context = await getProvisioningContext();
    const data = await chirpstack.getDevices(context.applicationId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("ChirpStack Devices Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
