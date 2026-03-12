import prisma from "@/lib/prisma";

export async function GET() {
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
}
