/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'mammoth', 'pdf-parse']
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  }
}

module.exports = nextConfig 