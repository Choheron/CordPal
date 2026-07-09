/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Bundles only the files needed to run the server — eliminates node_modules at runtime
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // Photo uploads pass through the uploadImageToBackend server action (default 1mb rejects most photos)
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coverartarchive.org',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
