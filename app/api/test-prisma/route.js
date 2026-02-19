import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Check if User model exists in Prisma Client
    const hasUserModel = typeof prisma.user !== "undefined";
    
    if (!hasUserModel) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Prisma Client does not have User model",
          message: "Run 'npx prisma generate' to regenerate Prisma Client"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try to query users
    const userCount = await prisma.user.count();
    const sampleUser = await prisma.user.findFirst({
      select: { id: true, username: true, accessAllClients: true }
    });

    return new Response(
      JSON.stringify({
        success: true,
        hasUserModel: true,
        userCount,
        sampleUser,
        prismaClientVersion: prisma._clientVersion || "unknown"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        error: e.message,
        stack: process.env.NODE_ENV === "development" ? e.stack : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
