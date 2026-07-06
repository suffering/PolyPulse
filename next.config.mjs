const nextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logo.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
