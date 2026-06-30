import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { email, workspaceId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID/slug is required" }, { status: 400 });
    }

    // 1. Authenticate the requester using server client (inherits user cookies)
    const supabase = await createServerClient();
    const { data: { user: caller } } = await supabase.auth.getUser();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve workspace slug to UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workspaceId);
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('id, name')
      .eq(isUUID ? 'id' : 'slug', workspaceId)
      .maybeSingle();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 3. Verify that the caller is an admin or owner of the workspace
    const { data: callerMember, error: callerError } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace.id)
      .eq('user_id', caller.id)
      .maybeSingle();

    if (callerError || !callerMember || (callerMember.role !== 'admin' && callerMember.role !== 'owner')) {
      return NextResponse.json({ error: "Only workspace admins or owners can invite members" }, { status: 403 });
    }

    // 4. Invite the user via Supabase Admin Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      console.error("Supabase invite error:", inviteError);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    const invitedUser = inviteData.user;

    // 5. Link the invited user to the workspace
    // Check if they are already in the workspace to prevent duplicate key errors
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspace.id)
      .eq('user_id', invitedUser.id)
      .maybeSingle();

    if (!existingMember) {
      const { error: memberError } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: invitedUser.id,
          role: 'member',
        });

      if (memberError) {
        console.error("Failed to link invited user to workspace:", memberError);
        return NextResponse.json({ error: "User invited but failed to add to workspace members" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, user: invitedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
