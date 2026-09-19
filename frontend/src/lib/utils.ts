import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format cryptographic hash with leading/trailing characters
 * Example: 0x8f9b1c2d3e...4d12
 */
export function truncateHash(hash: string, leadingChars = 6, trailingChars = 4): string {
  if (!hash || hash.length <= leadingChars + trailingChars) {
    return hash || "";
  }
  return `${hash.slice(0, leadingChars)}...${hash.slice(-trailingChars)}`;
}

/**
 * Format statutory timestamp to Indian Standard Time (IST)
 */
export function formatStatutoryDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "--";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
