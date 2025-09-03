
const withPWA = require('next-pwa')({
  dest: 'public', // Service Worker 和相关文件的输出目录
  register: true, // 自动在客户端注册 Service Worker
  skipWaiting: true, // 安装后立即激活新的 Service Worker
 disable: process.env.NODE_ENV === 'development', // 在开发环境中禁用 PWA，只在生产环境生效
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          // destination: 'http://localhost:7020/api/:path*',
          destination: 'https://test.scash.network/api/:path*',
        },
        {
          source: '/ext/:path*',
          destination: 'https://scash.tv/ext/:path*',
        },
      ]
    }
    return []
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
  // 修改开发服务器端口
  webpack: (config) => {
    return config
  },
  typescript: {
    // !! 警告: 仅用于构建通过，生产环境应移除此配置
    // ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // 添加对 WASM 文件的支持
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // 添加 WASM 文件的规则
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    // 如果是服务端，忽略某些模块
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'tiny-secp256k1': 'tiny-secp256k1'
      })
    }

    return config
  },
}

module.exports =  withPWA(nextConfig);