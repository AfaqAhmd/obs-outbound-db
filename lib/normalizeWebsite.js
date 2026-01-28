export function normalizeWebsite(raw) {
  if (raw == null) return null;
  let value = String(raw).trim();
  if (!value) return null;

  // obvious invalids
  if (value.includes(" ")) {
    return null;
  }

  let urlString = value.toLowerCase();
  if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
    urlString = "https://" + urlString;
  }

  try {
    const url = new URL(urlString);
    let host = url.hostname.toLowerCase();
    if (!host.includes(".")) {
      return null;
    }
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    host = host.replace(/\.$/, "");
    return host || null;
  } catch {
    return null;
  }
}

