import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Pretendard — 제품용 한글 UI 폰트. 다이나믹 서브셋(unicode-range)으로
// 화면에 실제로 쓰이는 글자만 런타임에 로드된다. (self-host, CSP 안전)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/globals.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root 를 찾을 수 없어요.');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
