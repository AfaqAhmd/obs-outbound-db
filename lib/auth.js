import { cookies } from "next/headers";

export async function setAdminSession(adminId) {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", adminId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value || null;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}
