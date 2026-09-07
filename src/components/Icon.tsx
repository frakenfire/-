// 선 아이콘 — 이모지 대신.
//
// 이모지는 기기마다 다른 그림이 나오고(애플/삼성/윈도우), 글리프가 라인박스를
// 넘쳐 카드 테두리를 뚫기도 한다. 토스는 굵기가 같은 선 아이콘으로 통일한다.
// 여기 있는 것들은 전부 24 그리드, 선 굵기 1.8, 끝은 둥글게.

type Props = { name: 'heart' | 'moon' | 'bell' | 'lock'; size?: number };

const PATHS: Record<Props['name'], JSX.Element> = {
  heart: (
    <path d="M12 20s-7-4.35-7-9.2A4.05 4.05 0 0 1 12 8a4.05 4.05 0 0 1 7 2.8c0 4.85-7 9.2-7 9.2Z" />
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  bell: (
    <>
      <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9" rx="2.5" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" />
    </>
  ),
};

export function Icon({ name, size = 22 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
