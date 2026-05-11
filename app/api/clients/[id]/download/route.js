import prisma from "@/lib/prisma";
import { dateStringToGMT5Date } from "@/lib/timezone";

function toDate(value) {
  if (!value) return null;
  return dateStringToGMT5Date(value, false);
}

function formatCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const EXPORT_BATCH_SIZE = 500;

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const dataType = (searchParams.get("dataType") || "").toLowerCase();
  const from = toDate(searchParams.get("from"));
  const to = dateStringToGMT5Date(searchParams.get("to"), true);
  const uploaderParam = (searchParams.get("uploader") || "").trim();
  const nicheParam = (searchParams.get("niche") || "").trim();
  const uploader =
    uploaderParam &&
    uploaderParam.toLowerCase() !== "all" &&
    uploaderParam.toLowerCase() !== "all uploaders"
      ? uploaderParam
      : null;
  const niche =
    nicheParam &&
    nicheParam.toLowerCase() !== "all" &&
    nicheParam.toLowerCase() !== "all niches"
      ? nicheParam
      : null;

  if (dataType !== "row" && dataType !== "enriched") {
    return new Response(
      JSON.stringify({ error: "dataType must be 'row' or 'enriched'" }),
      { status: 400 }
    );
  }

  // Get niche and uploader IDs if filters provided
  let nicheIdFilter = null;
  let uploaderIdFilter = null;

  if (niche) {
    const nicheRecord = await prisma.niche.findFirst({
      where: { name: niche }
    });
    if (nicheRecord) nicheIdFilter = nicheRecord.id;
  }

  if (uploader) {
    const uploaderRecord = await prisma.uploader.findFirst({
      where: { name: uploader }
    });
    if (uploaderRecord) uploaderIdFilter = uploaderRecord.id;
  }

  const uploadWhere = {
    clientId: params.id,
    dataType,
    ...(from || to
      ? {
          uploadDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {})
          }
        }
      : {}),
    ...(nicheIdFilter ? { nicheId: nicheIdFilter } : {}),
    ...(uploaderIdFilter ? { uploaderId: uploaderIdFilter } : {})
  };

  let rows = [];
  let headers = [];

  if (dataType === "row") {
    headers = [
      "Company Name",
      "Website",
      "Normalized website",
      "Category",
      "Review",
      "Rating",
      "Address",
      "Street",
      "City",
      "State",
      "Country",
      "Google URL",
      "Phone Number",
      "Niche",
      "Uploader",
      "Upload date"
    ];

    let cursorId = null;
    while (true) {
      const items = await prisma.rowData.findMany({
        where: {
          clientId: params.id,
          upload: {
            is: uploadWhere
          }
        },
        ...(cursorId
          ? {
              cursor: { id: cursorId },
              skip: 1
            }
          : {}),
        take: EXPORT_BATCH_SIZE,
        orderBy: { id: "asc" },
        include: {
          upload: {
            select: {
              niche: { select: { name: true } },
              uploader: { select: { name: true } },
              uploadDate: true
            }
          }
        }
      });

      if (!items.length) break;

      rows.push(
        ...items.map((r) => {
          const upload = r.upload;
          return [
            r.companyName,
            r.website,
            r.normalizedWebsite,
            r.category,
            r.review,
            r.rating,
            r.address,
            r.street,
            r.city,
            r.state,
            r.country,
            r.googleUrl,
            r.phoneNumber,
            upload?.niche?.name || null,
            upload?.uploader?.name || null,
            upload ? upload.uploadDate.toISOString() : null
          ];
        })
      );

      cursorId = items[items.length - 1].id;
    }
  } else {
    headers = [
      "Business name",
      "Normalized website",
      "Normalized business name",
      "Company LinkedIn",
      "Full name",
      "First Name",
      "Job title",
      "Person LinkedIn",
      "FME",
      "E1",
      "E2",
      "E3",
      "E4",
      "Sub1",
      "Sub2",
      "Sub3",
      "Sub4",
      "Niche",
      "Uploader",
      "Upload date"
    ];

    let cursorId = null;
    while (true) {
      const items = await prisma.enrichedData.findMany({
        where: {
          clientId: params.id,
          upload: {
            is: uploadWhere
          }
        },
        ...(cursorId
          ? {
              cursor: { id: cursorId },
              skip: 1
            }
          : {}),
        take: EXPORT_BATCH_SIZE,
        orderBy: { id: "asc" },
        include: {
          upload: {
            select: {
              niche: { select: { name: true } },
              uploader: { select: { name: true } },
              uploadDate: true
            }
          }
        }
      });

      if (!items.length) break;

      rows.push(
        ...items.map((r) => {
          const upload = r.upload;
          return [
            r.businessName,
            r.normalizedWebsite,
            r.normalizedBusinessName,
            r.companyLinkedin,
            r.fullName,
            r.firstName,
            r.jobTitle,
            r.personLinkedin,
            r.fme,
            r.e1,
            r.e2,
            r.e3,
            r.e4,
            r.sub1,
            r.sub2,
            r.sub3,
            r.sub4,
            upload?.niche?.name || null,
            upload?.uploader?.name || null,
            upload ? upload.uploadDate.toISOString() : null
          ];
        })
      );

      cursorId = items[items.length - 1].id;
    }
  }

  const lines = [headers.map(formatCsvValue).join(",")];
  if (rows.length) {
    lines.push(...rows.map((row) => row.map(formatCsvValue).join(",")));
  }

  const csv = lines.join("\r\n");

  const filename = `client-${params.id}-${dataType}-export.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}

