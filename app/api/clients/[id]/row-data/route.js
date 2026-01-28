import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const search = (searchParams.get("search") || "").trim();
  const sort = searchParams.get("sort") || "createdAt";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

  const where = {
    clientId: params.id
  };

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { website: { contains: search, mode: "insensitive" } },
      { normalizedWebsite: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } }
    ];
  }

  const allowedSort = {
    companyName: "companyName",
    normalizedWebsite: "normalizedWebsite",
    category: "category",
    createdAt: "createdAt"
  };

  const orderByField = allowedSort[sort] || "createdAt";

  const [total, items] = await Promise.all([
    prisma.rowData.count({ where }),
    prisma.rowData.findMany({
      where,
      orderBy: { [orderByField]: direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        upload: true
      }
    })
  ]);

  return new Response(JSON.stringify({ total, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

