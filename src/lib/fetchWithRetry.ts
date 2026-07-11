export async function fetchWithRetry(
  url: string,
  options: {
    retries?: number;
    backoff?: number;
    revalidate?: number | 0;
  } = {}
): Promise<Response> {
  const { retries = 1, backoff: initialBackoff = 800, revalidate = 3600 } = options;
  let backoff = initialBackoff;

  const endpointLabel = (() => {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`;
    } catch {
      return url.slice(0, 80);
    }
  })();


  for (let i = 0; i <= retries; i++) {
    let res: Response | null = null;
    let fetchError: unknown = null;

    try {
      res = await fetch(url, {
        next: revalidate === 0 ? { revalidate: 0 } : { revalidate },
      });
    } catch (err) {
      fetchError = err;
    }

    if (res?.status === 429) {
      throw new Error(`RATE_LIMITED: ${endpointLabel}`);
    }

    if (res?.ok) {
      return res;
    }

    if (i < retries) {
      if (fetchError || (res && res.status >= 500)) {
        await new Promise((r) => setTimeout(r, backoff));
        backoff *= 2;
        continue;
      }
      if (res && res.status >= 400 && res.status < 500) {
        throw new Error(`HTTP ${res.status} from ${endpointLabel}`);
      }
    } else {
      if (fetchError) throw fetchError;
      if (res && !res.ok) throw new Error(`HTTP ${res.status} from ${endpointLabel}`);
    }
  }
  
  throw new Error(`Data unavailable from ${endpointLabel}`);
}
