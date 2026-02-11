export function formatDateTimeGMT5(value) {
  if (!value) return "";
  const date =
    value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

