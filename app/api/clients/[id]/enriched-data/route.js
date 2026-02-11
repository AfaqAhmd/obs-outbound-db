import prisma from "@/lib/prisma";
import { dateStringToGMT5Date } from "@/lib/timezone";

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
    const fromDate = dateStringToGMT5Date(from, false);
    const toDate = dateStringToGMT5Date(to, true);
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
      { businessName: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { normalizedWebsite: { contains: search, mode: "insensitive" } }
    ];
  }

  const allowedSort = {
    businessName: "businessName",
    fullName: "fullName",
    jobTitle: "jobTitle",
    normalizedWebsite: "normalizedWebsite",
    createdAt: "createdAt"
  };

  const orderByField = allowedSort[sort] || "createdAt";

  const [total, items] = await Promise.all([
    prisma.enrichedData.count({ where }),
    prisma.enrichedData.findMany({
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

