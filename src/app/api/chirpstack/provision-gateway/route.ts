import { NextRequest, NextResponse } from "next/server";
import { chirpstack } from "@/lib/chirpstack";
import { getProvisioningContext } from "@/lib/chirpstack-provisioning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, eui, description, workspaceId } = body;
    
    console.log("PROVISIONING REQUEST:", { name, eui, workspaceId });

    if (!eui) {
      console.error("Provisioning failed: EUI is missing");
      return NextResponse.json({ error: "EUI is required for LoRaWAN gateways" }, { status: 400 });
    }

    // Get default tenant/etc
    const context = await getProvisioningContext();
    console.log("PROVISIONING CONTEXT:", context);

    const gateway = {
      gatewayId: eui.toLowerCase().replace(/[^0-9a-f]/g, ''),
      name: name,
      description: description || `Provisioned from IoT Platform (${workspaceId})`,
      tenantId: context.tenantId,
      statsInterval: 30, // Default 30s
    };

    console.log("CHIRPSTACK CREATE GATEWAY PAYLOAD:", JSON.stringify(gateway));

    const result = await chirpstack.createGateway(gateway);
    console.log("CHIRPSTACK CREATE SUCCESS:", result);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Gateway Provisioning Error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eui = searchParams.get("eui");

    if (!eui) {
      return NextResponse.json({ error: "EUI is required" }, { status: 400 });
    }

    const result = await chirpstack.deleteGateway(eui.toLowerCase());
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Gateway Deletion Error (ChirpStack):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
