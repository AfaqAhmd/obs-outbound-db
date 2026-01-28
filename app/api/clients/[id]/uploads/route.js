import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const search = (searchParams.get("search") || "").trim();
  const sort = searchParams.get("sort") || "uploadDate";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

  const where = {
    clientId: params.id
  };

  if (search) {
    where.OR = [
      { niche: { name: { contains: search, mode: "insensitive" } } },
      { uploader: { name: { contains: search, mode: "insensitive" } } },
      { dataType: { equals: search.toLowerCase() } }
    ];
  }

  const allowedSort = {
    uploadDate: "uploadDate",
    dataType: "dataType",
    rowCount: "rowCount",
    status: "status"
  };

  const orderByField = allowedSort[sort] || "uploadDate";

  const [total, items] = await Promise.all([
    prisma.upload.count({ where }),
    prisma.upload.findMany({
      where,
      orderBy: { [orderByField]: direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        niche: { select: { name: true } },
        uploader: { select: { name: true } }
      }
    })
  ]);

  return new Response(JSON.stringify({ total, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

