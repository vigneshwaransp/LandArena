/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    let backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    backendUrl = backendUrl.trim().replace(/\/+$/, '');

    const isInternalHost = !backendUrl.includes('.') || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1');

    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      if (isInternalHost) {
        backendUrl = backendUrl.includes(':') ? `http://${backendUrl}` : `http://${backendUrl}:10000`;
      } else {
        backendUrl = `https://${backendUrl}`;
      }
    } else if (isInternalHost && !backendUrl.replace('http://', '').replace('https://', '').includes(':')) {
      // Internal host without port defaults to port 10000 on Render private network
      backendUrl = `${backendUrl}:10000`;
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


