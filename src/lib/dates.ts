import { parseYmd } from "@/lib/pricing";

export function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function enumerateStayDates(checkInYmd: string, checkOutYmd: string) {
  const start = parseYmd(checkInYmd);
  const end = parseYmd(checkOutYmd);
  if (!start || !end) return [] as string[];
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur < end) {
    dates.push(formatYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

