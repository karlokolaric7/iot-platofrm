import { NextRequest, NextResponse } from "next/server";
import { chirpstack } from "@/lib/chirpstack";
import { getProvisioningContext } from "@/lib/chirpstack-provisioning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, devEui, appEui, appKey, description } = body;

    if (!devEui) {
      return NextResponse.json({ error: "devEui is required" }, { status: 400 });
    }

    // Normalize EUI to lowercase (ChirpStack requirement)
    const normalizedDevEui = devEui.toLowerCase().replace(/:/g, "");

    // Get (or create) the default application and device profile
    const context = await getProvisioningContext();

    const device = {
      devEui: normalizedDevEui,
      name: name || normalizedDevEui,
      description: description || "Provisioned from IoT Platform",
      applicationId: context.applicationId,
      deviceProfileId: context.deviceProfileId,
      skipFcntCheck: true,
      isDisabled: false,
    };

    // 1. Create the device in ChirpStack
    await chirpstack.createDevice(device);

    // 2. Set the OTAA keys if an AppKey was provided
    //    In LoRaWAN 1.0.x, the "AppKey" is stored as nwkKey in ChirpStack
    if (appKey) {
      const normalizedAppKey = appKey.toLowerCase().replace(/:/g, "");
      await chirpstack.createDeviceKeys(normalizedDevEui, {
        nwkKey: normalizedAppKey,
        // appKey is the same as nwkKey for LoRaWAN 1.0.x OTAA
        appKey: normalizedAppKey,
      });
    }

    return NextResponse.json({
      success: true,
      devEui: normalizedDevEui,
      applicationId: context.applicationId,
    });
  } catch (error: any) {
    console.error("Device Provisioning Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Unknown provisioning error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const devEui = searchParams.get("devEui");

    if (!devEui) {
      return NextResponse.json({ error: "devEui is required" }, { status: 400 });
    }

    const normalizedDevEui = devEui.toLowerCase().replace(/:/g, "");
    await chirpstack.deleteDevice(normalizedDevEui);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Device Delete Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
