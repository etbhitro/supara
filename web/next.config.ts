import type { NextConfig } from "next";

// МВП — статический сайт на GitHub Pages (адрес вида <user>.github.io/supara/).
const onPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: onPages ? "/supara" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
