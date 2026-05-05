import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Use Supabase Admin auth to invite a user
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (error) {
      console.error("Supabase invite error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
