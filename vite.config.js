import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function normalizeBase(base) {
  if (!base || base === '/') return '/';
  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 第三个参数 '' 表示加载所有环境变量，不管有没有 VITE_ 前缀
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET?.trim();

  return {
    base: normalizeBase(env.VITE_APP_BASE_PATH),
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      // 配置本地开发服务器代理
      proxy: proxyTarget ? {
        // 拦截所有以 /api 开头的请求
        '/api': {
          // 目标真实后端域名（注意：这里一般只写到域名）
          target: proxyTarget,

          // 必须开启：改变请求头的 origin，欺骗后端这是同源请求
          changeOrigin: true,

          // 路径重写：将前端发出的 '/api/xxx' 替换为后端的 '/api/v1/xxx'
          rewrite: (path) => path.replace(/^\/api/, '/api/v1'),

          // 如果后端是 HTTPS 且证书不受信任，可以设为 false (通常不需要)
          // secure: false,
        },
      } : undefined,
    },
  };
});
