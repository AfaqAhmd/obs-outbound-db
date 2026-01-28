import prisma from "@/lib/prisma";

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const dataType = (searchParams.get("dataType") || "").toLowerCase();
  const from = toDate(searchParams.get("from"));
  const to = toDate(searchParams.get("to"));
  // make "to" inclusive for whole day
  if (to) {
    to.setHours(23, 59, 59, 999);
  }
  const uploader = searchParams.get("uploader") || null;
  const niche = searchParams.get("niche") || null;

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

  const uploads = await prisma.upload.findMany({
    where: uploadWhere,
    select: {
      id: true,
      niche: { select: { name: true } },
      uploader: { select: { name: true } },
      uploadDate: true
    }
  });

  if (!uploads.length) {
    const emptyHeaders =
      dataType === "row"
        ? [
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
          ]
        : [
            "Business name",
            "Normalized website",
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

    const csv = emptyHeaders.map(formatCsvValue).join(",");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="client-${params.id}-${dataType}-export.csv"`
      }
    });
  }

  const uploadIdSet = new Set(uploads.map((u) => u.id));
  const uploadMap = new Map(uploads.map((u) => [u.id, u]));

  let rows = [];
  let headers = [];

  if (dataType === "row") {
    const items = await prisma.rowData.findMany({
      where: {
        clientId: params.id,
        uploadId: { in: Array.from(uploadIdSet) }
      },
      orderBy: { createdAt: "asc" }
    });

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

    rows = items.map((r) => {
      const upload = uploadMap.get(r.uploadId);
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
    });
  } else {
    const items = await prisma.enrichedData.findMany({
      where: {
        clientId: params.id,
        uploadId: { in: Array.from(uploadIdSet) }
      },
      orderBy: { createdAt: "asc" }
    });

    headers = [
      "Business name",
      "Normalized website",
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

    rows = items.map((r) => {
      const upload = uploadMap.get(r.uploadId);
      return [
        r.businessName,
        r.normalizedWebsite,
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
    });
  }

  const lines = [
    headers.map(formatCsvValue).join(","),
    ...rows.map((row) => row.map(formatCsvValue).join(","))
  ];

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

