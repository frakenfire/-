import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import aitDevtools from "@apps-in-toss/devtools/unplugin";

// 앱인토스 웹뷰 대상 MVP. 실제 배포 시에는 create-ait-app 로 생성한
// @apps-in-toss/web-framework 설정으로 교체한다. (PRD §13.3)
export default defineConfig({
  plugins: [aitDevtools.vite(), react()],
  server: {
    // 폰의 토스 샌드박스 앱에서 붙으려면 PC 의 와이파이 IP 로 열어야 한다.
    // npm run dev:toss -- 192.168.0.12 처럼 쓰면 scripts/dev-toss.mjs 가 넣어준다.
    host: process.env.AIT_DEV_HOST || 'localhost',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    // 소스맵 미배포 — 프로덕션 번들에서 원본 소스 노출 방지.
    sourcemap: false,
    minify: 'esbuild',
  },
  // 콘솔/디버거 제거 — 정보 노출 방지 + 번들 경량화.
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
