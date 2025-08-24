import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
 
// Local date constructor
export function getLocalDateTime(dateStr: string, timeStr: string): Date {
  const datetime = dayjs(`${dateStr} ${timeStr}`, "YYYY-MM-DD HH:mm");
  if (!datetime.isValid()) {
    throw new Error("Invalid date or time format");
  }
  return datetime.toDate();
} 