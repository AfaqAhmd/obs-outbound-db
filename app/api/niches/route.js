import prisma from "@/lib/prisma";

export async function GET() {
  const niches = await prisma.niche.findMany({
    orderBy: { name: "asc" }
  });

  return new Response(JSON.stringify({ niches }), { status: 200 });
}
