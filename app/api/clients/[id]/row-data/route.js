import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const search = (searchParams.get("search") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const uploader = (searchParams.get("uploader") || "").trim();
  const niche = (searchParams.get("niche") || "").trim();
  const sort = searchParams.get("sort") || "createdAt";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

  const where = {
    clientId: params.id
  };

  const uploadFilters = {};

  if (from || to) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }
    uploadFilters.uploadDate = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {})
    };
  }

  if (uploader) {
    uploadFilters.uploader = {
      name: { equals: uploader, mode: "insensitive" }
    };
  }

  if (niche) {
    uploadFilters.niche = {
      name: { equals: niche, mode: "insensitive" }
    };
  }

  if (Object.keys(uploadFilters).length > 0) {
    where.upload = uploadFilters;
  }

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
        upload: {
          include: {
            niche: true,
            uploader: true
          }
        }
      }
    })
  ]);

  return new Response(JSON.stringify({ total, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

