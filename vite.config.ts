import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 앱인토스 웹뷰 대상 MVP. 실제 배포 시에는 create-ait-app 로 생성한
// @apps-in-toss/web-framework 설정으로 교체한다. (PRD §13.3)
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
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
