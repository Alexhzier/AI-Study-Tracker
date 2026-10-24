import { TZDate } from "@date-fns/tz";
import { format, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from "date-fns";

/** Single source of truth for the app's timezone. */
export const APP_TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Asia/Manila";

/** "Now" expressed in the app timezone. */
export const nowInTz = () => TZDate.tz(APP_TZ);

/** Today's local date as yyyy-MM-dd (the value stored in study_sessions.session_date). */
export const todayISO = () => format(nowInTz(), "yyyy-MM-dd");

/** Week starts on Monday. All ranges are yyyy-MM-dd strings, inclusive. */
export function weekRange(ref: Date = nowInTz()) {
  const d = new TZDate(ref, APP_TZ);
  return {
    from: format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}

export function monthRange(ref: Date = nowInTz()) {
  const d = new TZDate(ref, APP_TZ);
  return {
    from: format(startOfMonth(d), "yyyy-MM-dd"),
    to: format(endOfMonth(d), "yyyy-MM-dd"),
  };
}

/** Local yyyy-MM-dd for a timestamp, in the app timezone. */
export const toLocalDateISO = (ts: Date | string | number) =>
  format(new TZDate(new Date(ts), APP_TZ), "yyyy-MM-dd");

/** Local HH:mm for a timestamp, in the app timezone. */
export const toLocalTime = (ts: Date | string | number) =>
  format(new TZDate(new Date(ts), APP_TZ), "HH:mm");

/** 135 -> "2h 15m" */
export function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
