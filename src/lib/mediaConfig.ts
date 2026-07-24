// Media hosting map. Small videos live in /public/videos/ and ship
// with the app; large videos live in R2 and are referenced via a
// public hostname configured on the client build.
//
// To turn on the four large videos:
//   1. In Cloudflare dashboard → R2 → cm-website → Settings → Public
//      access → enable the r2.dev subdomain.
//   2. Paste the resulting `pub-<hash>.r2.dev` hostname into your
//      env as `NEXT_PUBLIC_R2_VIDEO_HOSTNAME` (without protocol/slash).
//   3. Rebuild — the placeholders on /events + /careers + /why swap
//      to real <video> players automatically.
//
// If a video's URL resolves to `null`, the component renders a static
// "video coming soon" card so the layout stays intact.

const R2_HOSTNAME = process.env.NEXT_PUBLIC_R2_VIDEO_HOSTNAME || "";

type VideoAsset = { src: string; poster?: string; kind: "local" | "r2" | "missing" };

export function videoAsset(key: string, poster?: string): VideoAsset {
  // Local first — the two small event videos ship with the app.
  const LOCAL: Record<string, string> = {
    "marocotel-2024": "/videos/marocotel-2024.mp4",
    "cremai-2025": "/videos/cremai-2025.mp4",
  };
  if (LOCAL[key]) {
    return { src: LOCAL[key], poster, kind: "local" };
  }
  // R2-hosted — only resolvable once the public hostname is configured.
  const R2_KEYS: Record<string, string> = {
    "marocotel-2026": "videos/marocotel-2026.mp4",
    "franchise-2026": "videos/franchise-2026.mp4",
    "careers-interview": "videos/careers-anas-interview.mp4",
    "why-caisse-manager-broll": "videos/why-caisse-manager-broll.mp4",
  };
  const path = R2_KEYS[key];
  if (path && R2_HOSTNAME) {
    return { src: `https://${R2_HOSTNAME}/${path}`, poster, kind: "r2" };
  }
  return { src: "", poster, kind: "missing" };
}
