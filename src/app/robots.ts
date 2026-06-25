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
        disallow: [
          "/account/",
          "/cart",
          "/checkout/",
          "/signin",
          "/signup",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
