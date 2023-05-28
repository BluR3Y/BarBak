if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: '../env/client/development.env' });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  }
}

module.exports = nextConfig
