const USER_AGENT = "Mozilla/5.0 (compatible; SessaoDeRuaBot/0.1; agregador de sessões de cinemas de rua)";

/** Baixa o texto de uma URL com o nosso User-Agent. Lança erro se a resposta não for 2xx. */
export async function fetchText(url: string, accept: string, timeoutMs = 20_000): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT, accept },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
}

/** Baixa o HTML de uma página. Lança erro se a resposta não for 2xx. */
export const fetchHtml = (url: string, timeoutMs = 20_000) =>
  fetchText(url, "text/html,application/xhtml+xml", timeoutMs);
