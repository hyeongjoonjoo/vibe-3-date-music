const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseSelectedDate(input) {
  if (input instanceof Date) {
    return makeLocalDate(input.getFullYear(), input.getMonth() + 1, input.getDate());
  }

  if (typeof input === "string") {
    if (!ISO_DATE_PATTERN.test(input)) {
      throw new Error(`Expected date string in YYYY-MM-DD format, received "${input}".`);
    }

    const [year, month, day] = input.split("-").map(Number);
    return makeLocalDate(year, month, day);
  }

  throw new Error("Expected selected date to be a Date object or YYYY-MM-DD string.");
}

export function makeLocalDate(year, month, day) {
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${year}-${month}-${day}.`);
  }

  return date;
}

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toMonthDay(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export function formatKoreanDate(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

export function getSeasonName(date) {
  const monthDay = toMonthDay(date);

  if (isMonthDayInRange(monthDay, "03-01", "05-31")) return "spring";
  if (isMonthDayInRange(monthDay, "06-01", "08-31")) return "summer";
  if (isMonthDayInRange(monthDay, "09-01", "11-30")) return "autumn";
  return "winter";
}

export function daysBetween(a, b) {
  const first = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const second = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((second - first) / 86400000);
}

export function isDateInISODateRange(date, startISO, endISO) {
  const selected = toISODate(date);
  return selected >= startISO && selected <= endISO;
}

export function isMonthDayInRange(monthDay, startMonthDay, endMonthDay) {
  // Supports ranges that wrap across the end of the year, such as 12-15 to 01-10.
  if (startMonthDay <= endMonthDay) {
    return monthDay >= startMonthDay && monthDay <= endMonthDay;
  }

  return monthDay >= startMonthDay || monthDay <= endMonthDay;
}

export function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsKoreanText(value) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(String(value || ""));
}

export function countIntersections(first = [], second = []) {
  const secondSet = new Set(second);
  return first.reduce((count, value) => count + (secondSet.has(value) ? 1 : 0), 0);
}
