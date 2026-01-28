import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const assignments = await prisma.clientNiche.findMany({
    where: { clientId: params.id },
    include: {
      niche: true
    }
  });

  return new Response(
    JSON.stringify({ niches: assignments.map((a) => a.niche) }),
    { status: 200 }
  );
}
