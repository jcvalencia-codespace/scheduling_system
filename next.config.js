<<<<<<< HEAD
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['scheduling-system-7ncq.onrender.com']
  }
}

module.exports = nextConfig;
=======
module.exports = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  };
>>>>>>> 525759006961b138ebd4383c88bbf62d01e4e4c7
