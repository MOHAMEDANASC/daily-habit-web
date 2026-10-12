import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: { userAgent: "*", allow: ["/", "/login", "/register"], disallow: ["/api/", "/dashboard", "/tracker", "/habits", "/calendar", "/analytics", "/goals", "/notifications", "/profile", "/settings", "/reset-password"] },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
  };
}
