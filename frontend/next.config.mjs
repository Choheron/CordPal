/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Bundles only the files needed to run the server — eliminates node_modules at runtime
  reactStrictMode: false,
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
