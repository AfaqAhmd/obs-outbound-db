import { clearUserSession } from "@/lib/auth";

export async function POST() {
  await clearUserSession();
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
