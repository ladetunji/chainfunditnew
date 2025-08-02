export async function shortenLink(longUrl: string): Promise<string | null> {
  const apiKey = process.env.DUB_CO_TOKEN;
  if (!apiKey) return null;

  const res = await fetch("https://api.dub.co/links", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: longUrl,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.shortLink || null;
}