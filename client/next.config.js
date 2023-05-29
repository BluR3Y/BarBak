// if (process.env.NODE_ENV === 'development') {
//   require('dotenv').config({ path: '../env/client/development.env' });
// }

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  // Assign environment variables dynamically at runtime : Server-Side
  serverRuntimeConfig: {},
  // Assign environment variables dynamically at runtime : Client-Side
  publicRuntimeConfig: {},
  // Assign environment variables at build time
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || '/api'
  }
}

module.exports = nextConfig
