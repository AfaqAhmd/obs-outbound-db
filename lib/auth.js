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

// User session management
export async function setUserSession(userId) {
  const cookieStore = await cookies();
  cookieStore.set("user_session", userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export async function getUserSession() {
  const cookieStore = await cookies();
  return cookieStore.get("user_session")?.value || null;
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete("user_session");
}
