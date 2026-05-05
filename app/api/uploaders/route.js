import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const uploaders = await prisma.uploader.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    });

    return new Response(JSON.stringify({ uploaders }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  } catch (e) {
    console.error("Failed to load uploaders:", e);
    return new Response(JSON.stringify({ error: "Failed to load uploaders" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  }
}
