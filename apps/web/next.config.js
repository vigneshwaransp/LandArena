/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    let backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    backendUrl = backendUrl.trim().replace(/\/+$/, '');
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `https://${backendUrl}`;
    }
    if (backendUrl.endsWith('/api')) {
      backendUrl = backendUrl.slice(0, -4);
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;


