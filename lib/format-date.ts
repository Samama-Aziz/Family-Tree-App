export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    // Append time to avoid UTC-midnight timezone shifts for pure date strings
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    const date = isDateOnly ? new Date(dateString + "T00:00:00") : new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch {
    return "—";
  }
}
