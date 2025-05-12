/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['https://schednu.onrender.com/'], // Add your deployment domain
    unoptimized: true // Try this if images still don't load
  },
}

module.exports = nextConfig
