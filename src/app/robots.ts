// robots.ts — Next.js app router auto-generates /robots.txt from this
// export. Allows every crawler full access to marketing + commerce
// surfaces, blocks the authenticated portal and transactional flows
// that have no organic-search value.

import type { MetadataRoute } from "next";

const SITE_URL = "https://caissemanager.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `/_next/` must NOT be blocked. Google needs `/_next/static/**`
        // to fetch the JS and CSS chunks, and `/_next/image` to fetch
        // every optimized image. Blocking it meant Googlebot could not
        // execute the bundle — and because section content mounts behind
        // a framer-motion reveal that starts at opacity 0, the page
        // Google actually rendered was very close to blank. Google's own
        // guidance is explicit that render-critical assets stay
        // crawlable.
        disallow: [
          "/account/",
          "/cart",
          "/checkout/",
          "/signin",
          "/signup",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
