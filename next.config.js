/** @type {import('next').NextConfig} */
const nextConfig = {
  // sql.js is pure JavaScript — no webpack externals needed.
  // If you ever upgrade to better-sqlite3 (native C++ module), uncomment:
  // webpack: (config, { isServer }) => {
  //   if (isServer) config.externals.push('better-sqlite3');
  //   return config;
  // },
};

module.exports = nextConfig;
