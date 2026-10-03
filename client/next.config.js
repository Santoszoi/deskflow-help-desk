import path from 'node:path';
import { fileURLToPath } from 'node:url';
/** @type {import('next').NextConfig} */
const nextConfig = {
 reactStrictMode: true,
 output: 'standalone',
 outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
 async rewrites(){return [{source:'/api/:path*',destination:`${process.env.API_INTERNAL_URL || 'http://127.0.0.1:3333'}/api/:path*`}]},
};
export default nextConfig;
