/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf-lib', '@pdf-lib/fontkit'],
    outputFileTracingIncludes: {
      '/api/**/*': [
        './public/fonts/**/*',
        './public/templates/**/*',
        './data/**/*',
      ],
    },
  },
};

export default nextConfig;
