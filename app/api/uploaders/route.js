import prisma from "@/lib/prisma";

export async function GET() {
  const uploaders = await prisma.uploader.findMany({
    orderBy: { name: "asc" }
  });

  return new Response(JSON.stringify({ uploaders }), { status: 200 });
}
