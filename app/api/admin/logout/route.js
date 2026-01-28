import { clearAdminSession } from "@/lib/auth";

export async function POST() {
  await clearAdminSession();
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
