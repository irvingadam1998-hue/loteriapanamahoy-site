export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const content =
    client && /^ca-pub-\d{16}$/.test(client)
      ? `google.com, ${client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0\n`
      : "# No advertising account is configured.\n";
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
