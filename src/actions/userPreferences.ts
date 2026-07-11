"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
  let list = await getCookieList("ledger_watchlist");

  if (list.includes(symbol)) {
    list = list.filter((s) => s !== symbol);
  } else {
    list.push(symbol);
    if (list.length > 20) list.shift();
  }

  await setCookieList("ledger_watchlist", list);
  revalidatePath("/watchlist");
  revalidatePath("/", "layout");
}

export async function getWatchlist(): Promise<string[]> {
  return getCookieList("ledger_watchlist");
}

export async function toggleCompare(symbol: string) {
  let compare = await getCookieList("ledger_compare");

  if (compare.includes(symbol)) {
    compare = compare.filter((s) => s !== symbol);
  } else {
    compare.push(symbol);
    if (compare.length > 4) compare.shift();
  }

  await setCookieList("ledger_compare", compare);
  revalidatePath("/compare");
  revalidatePath("/", "layout");
}

export async function getCompareList(): Promise<string[]> {
  return getCookieList("ledger_compare");
}
