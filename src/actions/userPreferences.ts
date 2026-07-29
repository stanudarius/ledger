"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { validateTicker } from "./ticker";

async function getCookieList(key: string): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(key)?.value || "";
  return raw ? raw.split(",").filter(Boolean) : [];
}

async function setCookieList(key: string, list: string[]) {
  const cookieStore = await cookies();
  cookieStore.set(key, list.join(","), { path: "/", maxAge: 60 * 60 * 24 * 90 });
}

export async function toggleWatchlist(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  let list = await getCookieList("ledger_watchlist");

  if (list.includes(normalized)) {
    list = list.filter((s) => s !== normalized);
  } else {
    if (!(await validateTicker(normalized))) return { success: false, error: "Ticker not found" };
    list.push(normalized);
    if (list.length > 20) list.shift();
  }

  await setCookieList("ledger_watchlist", list);
  revalidatePath("/watchlist");
  return { success: true };
}

export async function getWatchlist(): Promise<string[]> {
  return getCookieList("ledger_watchlist");
}

export async function toggleCompare(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  let compare = await getCookieList("ledger_compare");

  if (compare.includes(normalized)) {
    compare = compare.filter((s) => s !== normalized);
  } else {
    if (!(await validateTicker(normalized))) return { success: false, error: "Ticker not found" };
    compare.push(normalized);
    if (compare.length > 4) compare.shift();
  }

  await setCookieList("ledger_compare", compare);
  revalidatePath("/compare");
  return { success: true };
}

export async function getCompareList(): Promise<string[]> {
  return getCookieList("ledger_compare");
}
