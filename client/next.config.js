if (process.env.NODE_ENV !== 'production')
  require('dotenv').config({ path: './env/development.env' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  }
}

module.exports = nextConfig
