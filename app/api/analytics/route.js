import prisma from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "clientId is required" }),
      { status: 400 }
    );
  }

  // Get all uploads for this client
  const uploads = await prisma.upload.findMany({
    where: {
      clientId,
      status: "success"
    },
    select: {
      id: true,
      niche: {
        select: { name: true }
      },
      uploader: {
        select: { name: true }
      },
      uploadDate: true,
      dataType: true,
      rowCount: true
    },
    orderBy: {
      uploadDate: "asc"
    }
  });

  // Analytics by date
  const byDate = {};
  uploads.forEach((upload) => {
    const dateKey = upload.uploadDate.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        date: dateKey,
        uploads: 0,
        rowData: 0,
        enrichedData: 0,
        totalRows: 0
      };
    }
    byDate[dateKey].uploads += 1;
    if (upload.dataType === "row") {
      byDate[dateKey].rowData += 1;
    } else {
      byDate[dateKey].enrichedData += 1;
    }
    byDate[dateKey].totalRows += upload.rowCount || 0;
  });

  // Analytics by niche
  const byNiche = {};
  uploads.forEach((upload) => {
    const niche = upload.niche?.name || "Unknown";
    if (!byNiche[niche]) {
      byNiche[niche] = {
        niche,
        uploads: 0,
        rowData: 0,
        enrichedData: 0,
        totalRows: 0
      };
    }
    byNiche[niche].uploads += 1;
    if (upload.dataType === "row") {
      byNiche[niche].rowData += 1;
    } else {
      byNiche[niche].enrichedData += 1;
    }
    byNiche[niche].totalRows += upload.rowCount || 0;
  });

  // Analytics by uploader
  const byUploader = {};
  uploads.forEach((upload) => {
    const uploader = upload.uploader?.name || "Unknown";
    if (!byUploader[uploader]) {
      byUploader[uploader] = {
        uploader,
        uploads: 0,
        rowData: 0,
        enrichedData: 0,
        totalRows: 0
      };
    }
    byUploader[uploader].uploads += 1;
    if (upload.dataType === "row") {
      byUploader[uploader].rowData += 1;
    } else {
      byUploader[uploader].enrichedData += 1;
    }
    byUploader[uploader].totalRows += upload.rowCount || 0;
  });

  // Get total counts
  const totalUploads = uploads.length;
  const totalRowData = await prisma.rowData.count({
    where: { clientId }
  });
  const totalEnrichedData = await prisma.enrichedData.count({
    where: { clientId }
  });

  return new Response(
    JSON.stringify({
      byDate: Object.values(byDate).sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
      byNiche: Object.values(byNiche).sort((a, b) =>
        b.totalRows - a.totalRows
      ),
      byUploader: Object.values(byUploader).sort((a, b) =>
        b.totalRows - a.totalRows
      ),
      totals: {
        uploads: totalUploads,
        rowData: totalRowData,
        enrichedData: totalEnrichedData,
        totalRows: totalRowData + totalEnrichedData
      }
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
