import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  const uploads = await prisma.upload.findMany({
    where: { clientId: params.id },
    select: {
      uploader: {
        select: { id: true, name: true }
      }
    }
  });

  const uploaderMap = new Map();
  uploads.forEach((u) => {
    if (u.uploader) {
      uploaderMap.set(u.uploader.id, u.uploader.name);
    }
  });

  const names = Array.from(uploaderMap.values()).sort();

  return new Response(JSON.stringify({ uploaders: names }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

