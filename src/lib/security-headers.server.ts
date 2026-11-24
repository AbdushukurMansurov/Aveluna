export async function secureResponse(request: Request, response: Response): Promise<Response> {
  const host = new URL(request.url).hostname;
  const dev = import.meta.env.DEV || host === "localhost" || host === "127.0.0.1";
  const preview = dev || host.startsWith("id-preview") || host.startsWith("preview") || host.endsWith(".lovableproject.com") || /^project--.*-dev\.lovable\.app$/.test(host);
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  if (!preview) headers.set("X-Frame-Options", "DENY");
  // Do not restrict resources: streaming SSR adds hydration scripts after headers are set.
  // Keep document protections without blocking React, styles, maps, or API connections.
  headers.set("Content-Security-Policy", [
    "object-src 'none'", "base-uri 'self'", "form-action 'self'",
    preview ? "frame-ancestors 'self' https://lovable.dev https://*.lovable.dev" : "frame-ancestors 'none'",
  ].join("; "));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}