/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // USER SITE — no basePath or assetPrefix needed (root of domain)
  basePath: "",
  assetPrefix: "",
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
  // Transpile packages
  transpilePackages: [],
};

export default nextConfig;
