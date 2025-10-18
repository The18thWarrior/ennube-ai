/** @type {import("next").NextConfig} */
module.exports = {
  output: "standalone",
  experimental: {
    nodeMiddleware: true,
  },
}
