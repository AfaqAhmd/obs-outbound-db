import prisma from "@/lib/prisma";
import { normalizeWebsite } from "@/lib/normalizeWebsite";
import { getCurrentDateGMT5 } from "@/lib/timezone";
import Papa from "papaparse";

const REQUIRED_ROW_HEADERS = [
  "Company Name",
  "Website",
  "Category",
  "Review",
  "Rating"
];

const REQUIRED_ENRICHED_HEADERS = [
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
  "Sub4"
];

function buildHeaderMap(headers) {
  const map = {};
  headers.forEach((h, idx) => {
    const key = h.trim().toLowerCase();
    if (!map[key]) {
      map[key] = idx;
    }
  });
  return map;
}

function validateHeaders(required, headers) {
  const lowerHeaders = headers.map((h) => h.trim().toLowerCase());
  const missing = [];

  // columns that are allowed to be completely absent
  const optionalColumns = new Set([
    "company linkedin", // enriched
    "e4", // enriched
    "sub4", // enriched
    "address", // row
    "street", // row
    "city", // row
    "state", // row
    "country", // row
    "google url", // row
    "phone number" // row
  ]);

  for (const h of required) {
    const key = h.trim().toLowerCase();
    if (optionalColumns.has(key)) {
      continue;
    }
    if (!lowerHeaders.includes(key)) {
      missing.push(h);
    }
  }
  return missing;
}

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const clientId = formData.get("clientId");
  const nicheId = formData.get("nicheId");
  const uploaderId = formData.get("uploaderId");
  const dataType = (formData.get("dataType") || "").toString();

  if (!file || !clientId || !nicheId || !uploaderId || !dataType) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400 }
    );
  }

  const uploadDate = getCurrentDateGMT5();
  const originalFilename = file.name || "upload.csv";

  const buffer = Buffer.from(await file.arrayBuffer());
  const csv = buffer.toString("utf-8");

  const parseResult = Papa.parse(csv, {
    header: true,
    skipEmptyLines: "greedy"
  });

  if (parseResult.errors && parseResult.errors.length) {
    const message = parseResult.errors[0].message || "Failed to parse CSV";
    const upload = await prisma.upload.create({
      data: {
        clientId,
        nicheId,
        uploaderId,
        dataType,
        uploadDate,
        originalFilename,
        status: "failed",
        errorMessage: message
      }
    });
    return new Response(
      JSON.stringify({ error: message, uploadId: upload.id }),
      { status: 400 }
    );
  }

  const headers = parseResult.meta.fields || [];
  const required =
    dataType === "row" ? REQUIRED_ROW_HEADERS : REQUIRED_ENRICHED_HEADERS;
  const missing = validateHeaders(required, headers);
  if (missing.length) {
    const message =
      "Missing required columns: " + missing.map((m) => `"${m}"`).join(", ");
    const upload = await prisma.upload.create({
      data: {
        clientId,
        nicheId,
        uploaderId,
        dataType,
        uploadDate,
        originalFilename,
        status: "failed",
        errorMessage: message
      }
    });
    return new Response(
      JSON.stringify({ error: message, uploadId: upload.id }),
      { status: 400 }
    );
  }

  const headerMap = buildHeaderMap(headers);
  const rows = parseResult.data;

  try {
    // Increase transaction timeout to 30 seconds for large uploads
    const result = await prisma.$transaction(
      async (tx) => {
      if (dataType === "row") {
        const rawPayload = rows.map((row) => {
          function val(label) {
            const key = label.trim().toLowerCase();
            const index = headerMap[key];
            if (index === undefined) return null;
            const fieldName = headers[index];
            const value = row[fieldName];
            if (value == null) return null;
            const s = String(value).trim();
            return s === "" ? null : s;
          }

          const websiteRaw = val("Website");
          const normalized = normalizeWebsite(websiteRaw);

          return {
            clientId,
            companyName: val("Company Name"),
            website: websiteRaw,
            normalizedWebsite: normalized,
            category: val("Category"),
            review: val("Review"),
            rating: val("Rating"),
            address: val("Address"),
            street: val("Street"),
            city: val("City"),
            state: val("State"),
            country: val("Country"),
            googleUrl: val("Google URL"),
            phoneNumber: val("Phone Number")
          };
        });

        // dedupe raw data by normalized_website:
        // - drop duplicate normalized_websites within this upload
        // - drop rows whose normalized_website already exists for this client in the database
        const seenNormalized = new Set();
        const uniquePayload = rawPayload.filter((row) => {
          if (!row.normalizedWebsite) return true;
          if (seenNormalized.has(row.normalizedWebsite)) return false;
          seenNormalized.add(row.normalizedWebsite);
          return true;
        });

        const normalizedToCheck = Array.from(
          new Set(
            uniquePayload
              .map((r) => r.normalizedWebsite)
              .filter((v) => v && typeof v === "string")
          )
        );

        let existingNormalizedSet = new Set();
        if (normalizedToCheck.length) {
          // Batch the deduplication query to avoid large IN clauses (PostgreSQL limit ~1000)
          const DEDUPE_BATCH_SIZE = 1000;
          for (let i = 0; i < normalizedToCheck.length; i += DEDUPE_BATCH_SIZE) {
            const batch = normalizedToCheck.slice(i, i + DEDUPE_BATCH_SIZE);
            const existing = await tx.rowData.findMany({
              where: {
                clientId,
                normalizedWebsite: { in: batch }
              },
              select: { normalizedWebsite: true }
            });
            existing.forEach((e) => existingNormalizedSet.add(e.normalizedWebsite));
          }
        }

        const finalPayload = uniquePayload.filter((row) => {
          if (!row.normalizedWebsite) return true;
          return !existingNormalizedSet.has(row.normalizedWebsite);
        });

        const upload = await tx.upload.create({
          data: {
            clientId,
            nicheId,
            uploaderId,
            dataType,
            uploadDate,
            originalFilename,
            rowCount: finalPayload.length,
            status: "success"
          }
        });

        if (finalPayload.length) {
          const dataWithUpload = finalPayload.map((row) => ({
            ...row,
            uploadId: upload.id
          }));

          try {
            // Batch inserts for large datasets (Prisma has a limit of ~1000 rows per createMany)
            const BATCH_SIZE = 1000;
            for (let i = 0; i < dataWithUpload.length; i += BATCH_SIZE) {
              const batch = dataWithUpload.slice(i, i + BATCH_SIZE);
              await tx.rowData.createMany({
                data: batch,
                skipDuplicates: false
              });
            }
          } catch (createError) {
            console.error("createMany error:", createError);
            throw new Error(
              `Failed to insert row data: ${createError.message || createError}`
            );
          }
        }

        return upload;
      } else {
        const rawPayload = rows.map((row) => {
          function val(label) {
            const key = label.trim().toLowerCase();
            const index = headerMap[key];
            if (index === undefined) return null;
            const fieldName = headers[index];
            const value = row[fieldName];
            if (value == null) return null;
            const s = String(value).trim();
            return s === "" ? null : s;
          }

          return {
            clientId,
            businessName: val("Business name"),
            normalizedWebsite: val("Normalized website"),
            companyLinkedin: val("Company LinkedIn"),
            fullName: val("Full name"),
            firstName: val("First Name"),
            jobTitle: val("Job title"),
            personLinkedin: val("Person LinkedIn"),
            fme: val("FME"),
            e1: val("E1"),
            e2: val("E2"),
            e3: val("E3"),
            e4: val("E4"),
            sub1: val("Sub1"),
            sub2: val("Sub2"),
            sub3: val("Sub3"),
            sub4: val("Sub4")
          };
        });

        // dedupe enriched data by FME:
        // - drop duplicate FMEs within this upload
        // - drop rows whose FME already exists for this client in the database
        const seenFme = new Set();
        const uniquePayload = rawPayload.filter((row) => {
          if (!row.fme) return true;
          if (seenFme.has(row.fme)) return false;
          seenFme.add(row.fme);
          return true;
        });

        const fmesToCheck = Array.from(
          new Set(
            uniquePayload
              .map((r) => r.fme)
              .filter((v) => v && typeof v === "string")
          )
        );

        let existingFmeSet = new Set();
        if (fmesToCheck.length) {
          // Batch the deduplication query to avoid large IN clauses (PostgreSQL limit ~1000)
          const DEDUPE_BATCH_SIZE = 1000;
          for (let i = 0; i < fmesToCheck.length; i += DEDUPE_BATCH_SIZE) {
            const batch = fmesToCheck.slice(i, i + DEDUPE_BATCH_SIZE);
            const existing = await tx.enrichedData.findMany({
              where: {
                clientId,
                fme: { in: batch }
              },
              select: { fme: true }
            });
            existing.forEach((e) => existingFmeSet.add(e.fme));
          }
        }

        const finalPayload = uniquePayload.filter((row) => {
          if (!row.fme) return true;
          return !existingFmeSet.has(row.fme);
        });

        const upload = await tx.upload.create({
          data: {
            clientId,
            nicheId,
            uploaderId,
            dataType,
            uploadDate,
            originalFilename,
            rowCount: finalPayload.length,
            status: "success"
          }
        });

        if (finalPayload.length) {
          const dataWithUpload = finalPayload.map((row) => ({
            ...row,
            uploadId: upload.id
          }));

          // Batch inserts for large datasets (Prisma has a limit of ~1000 rows per createMany)
          const BATCH_SIZE = 1000;
          for (let i = 0; i < dataWithUpload.length; i += BATCH_SIZE) {
            const batch = dataWithUpload.slice(i, i + BATCH_SIZE);
            await tx.enrichedData.createMany({
              data: batch,
              skipDuplicates: false
            });
          }
        }

        return upload;
      }
    },
    {
      timeout: 30000 // 30 seconds for large CSV uploads
    });

    return new Response(
      JSON.stringify({ uploadId: result.id, rowCount: result.rowCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (e) {
    console.error("Upload error:", e);
    const errorMessage =
      e.message || e.toString() || "Failed to insert rows";
    const upload = await prisma.upload.create({
      data: {
        clientId,
        nicheId,
        uploaderId,
        dataType,
        uploadDate,
        originalFilename,
        rowCount: rows.length,
        status: "failed",
        errorMessage: errorMessage.substring(0, 500) // limit length
      }
    });
    return new Response(
      JSON.stringify({
        error: errorMessage,
        uploadId: upload.id
      }),
      { status: 500 }
    );
  }
}

