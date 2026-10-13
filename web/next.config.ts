import type { NextConfig } from "next";

// МВП — статический сайт на GitHub Pages (адрес вида <user>.github.io/supara/).
const onPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: onPages ? "/supara" : "",
  trailingSlash: true,
  images: { unoptimized: true },
  // Для обычных <img>: Next сам подставляет basePath только в свои ссылки.
  env: { NEXT_PUBLIC_BASE: onPages ? "/supara" : "" },
};

export default nextConfig;
