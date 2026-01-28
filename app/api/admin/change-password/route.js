import prisma from "@/lib/prisma";
import { getAdminSession, clearAdminSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return sessionId;
}

export async function POST(request) {
  const sessionId = await checkAuth();
  if (!sessionId || sessionId.error) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401
    });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({
          error: "Current password and new password are required"
        }),
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({
          error: "New password must be at least 8 characters long"
        }),
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { id: sessionId }
    });

    if (!admin) {
      return new Response(JSON.stringify({ error: "Admin not found" }), {
        status: 404
      });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Current password is incorrect" }),
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashed }
    });

    // Optional: force re-login after password change
    await clearAdminSession();

    return new Response(
      JSON.stringify({ success: true, message: "Password updated" }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Change password error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to change password" }),
      { status: 500 }
    );
  }
}

