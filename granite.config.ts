import { defineConfig } from '@apps-in-toss/web-framework/config';

// 앱인토스(Apps in Toss) 미니앱 배포 설정.
// 공식 문서: https://developers-apps-in-toss.toss.im/
//
// ⚠️ 콘솔 연동 필수 항목 (앱인토스 개발자센터에서 앱 등록 후 채워야 함):
//   - appName: 콘솔에서 발급받은 앱 ID 로 교체
//   - brand.icon: 콘솔에 업로드한 아이콘 이미지 URL 로 교체
// 위 두 값은 콘솔 등록값과 반드시 일치해야 배포가 정상 동작한다.
export default defineConfig({
  // 콘솔에서 발급받은 앱 ID. (등록 전까지는 임시 slug)
  appName: 'today-note',
  web: {
    host: 'localhost',
    port: 5173,
    // 기존 Vite 빌드를 그대로 사용한다. (rsbuild 강제 아님 — web.commands 로 지정)
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  // 네이티브 권한 미사용 — 위치·카메라·연락처 등 브릿지 권한을 쓰지 않는다.
  // (공유·클립보드는 표준 웹 API(navigator.share/clipboard)로 처리)
  permissions: [],
  // Vite 빌드 산출물 경로와 일치해야 한다.
  outdir: 'dist',
  brand: {
    displayName: '오늘쪽지 뽑기',
    // TODO: 콘솔에 업로드한 아이콘 URL 로 교체 (static.toss.im/appsintoss/...)
    icon: 'https://static.toss.im/appsintoss/placeholder-today-note.png',
    primaryColor: '#3182f6',
  },
  webViewProps: {
    type: 'partner',
  },
});
