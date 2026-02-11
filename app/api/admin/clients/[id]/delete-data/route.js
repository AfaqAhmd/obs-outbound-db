import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

async function checkAuth() {
  const sessionId = await getAdminSession();
  if (!sessionId) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function POST(request, { params }) {
  const authError = await checkAuth();
  if (authError) {
    return new Response(JSON.stringify({ error: authError.error }), {
      status: authError.status
    });
  }

  const clientId = params.id;

  try {
    const body = await request.json();
    const dataType = (body.dataType || "both").toLowerCase(); // 'row', 'enriched', 'both'
    const from = body.from || null;
    const to = body.to || null;
    const uploader = (body.uploader || "").trim();
    const niche = (body.niche || "").trim();

    // Build upload filter shared for row/enriched
    const uploadWhere = {
      clientId
    };

    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      if (fromDate) {
        fromDate.setHours(0, 0, 0, 0);
      }
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
      }
      uploadWhere.uploadDate = {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {})
      };
    }

    if (uploader) {
      uploadWhere.uploader = {
        name: { equals: uploader, mode: "insensitive" }
      };
    }

    if (niche) {
      uploadWhere.niche = {
        name: { equals: niche, mode: "insensitive" }
      };
    }

    const includeRow = dataType === "row" || dataType === "both";
    const includeEnriched = dataType === "enriched" || dataType === "both";

    if (!includeRow && !includeEnriched) {
      return new Response(
        JSON.stringify({ error: "Invalid dataType. Use 'row', 'enriched', or 'both'." }),
        { status: 400 }
      );
    }

    const uploads = await prisma.upload.findMany({
      where: uploadWhere,
      select: { id: true, dataType: true }
    });

    if (!uploads.length) {
      return new Response(
        JSON.stringify({ deletedRow: 0, deletedEnriched: 0, deletedUploads: 0 }),
        { status: 200 }
      );
    }

    const rowUploadIds = uploads
      .filter((u) => u.dataType === "row")
      .map((u) => u.id);
    const enrichedUploadIds = uploads
      .filter((u) => u.dataType === "enriched")
      .map((u) => u.id);

    const result = await prisma.$transaction(async (tx) => {
      let deletedRow = 0;
      let deletedEnriched = 0;

      if (includeRow && rowUploadIds.length) {
        const res = await tx.rowData.deleteMany({
          where: {
            clientId,
            uploadId: { in: rowUploadIds }
          }
        });
        deletedRow = res.count;
      }

      if (includeEnriched && enrichedUploadIds.length) {
        const res = await tx.enrichedData.deleteMany({
          where: {
            clientId,
            uploadId: { in: enrichedUploadIds }
          }
        });
        deletedEnriched = res.count;
      }

      // Delete uploads that no longer have any row/enriched records
      const uploadsToDelete = await tx.upload.findMany({
        where: {
          clientId,
          id: { in: uploads.map((u) => u.id) },
          rowData: { none: {} },
          enrichedData: { none: {} }
        },
        select: { id: true }
      });

      let deletedUploads = 0;
      if (uploadsToDelete.length) {
        const delRes = await tx.upload.deleteMany({
          where: {
            id: { in: uploadsToDelete.map((u) => u.id) }
          }
        });
        deletedUploads = delRes.count;
      }

      return { deletedRow, deletedEnriched, deletedUploads };
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Admin delete data error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to delete data" }),
      { status: 500 }
    );
  }
}

