# 내일쪽지 뽑기 (tomorrow-note)

토스 **앱인토스(Apps in Toss)** 웹뷰용 **무비용·광고형 가벼운 운세 쪽지 미니앱** MVP.
보고 싶은 운세(내일의 나 · 이번 달의 나 · 연애운 · 돈운 · 일운 · 조심할 것 · 행운 포인트)를 고르고
접힌 쪽지 한 장을 뽑으면 결과를 받고 저장·공유할 수 있어요.
**실제 생성형 AI / 서버 / DB 없이** 선택값·쪽지 데이터·날짜 seed 조합으로 동작합니다.

> `PRD: 내일쪽지 뽑기`(§0~§15)의 MVP 구현체입니다.

## 핵심 원칙 (PRD 준수)

- **AI API 호출 없음** — 결과는 `fortuneType + note + dateSeed` 조합 (`src/lib/generateFortune.ts`)
- **서버/DB/로그인 없음** — 상태는 React state, 기록은 `localStorage`(선택형 값만)
- **개인정보/자유입력 저장 없음** (`src/lib/storage.ts`)
- **가볍고 희망적인 톤, 해요체** — 의료/금융/법률 조언 및 단정·불안 표현 금지 (PRD §10.2)
- **광고는 mock** — `Promise<boolean>` mock (`src/lib/ads.ts`)
- **디자인** — 배경 크림 `#fff8ed`, Primary `#114e48`(SIGNATURE GREEN),
  행운 포인트/스티커에만 `#ff4b00` 제한 사용, 375px 기준·360~430px 대응
- **쪽지/별/스티커 느낌의 가벼운 뽑기 UI** — 무거운 명상/타로/무속 느낌 배제

## 화면 흐름 (PRD §4)

```
Home → FortuneType(운세 선택) → NotePick(쪽지 3장 중 1장) → Result(무료 3줄) → Detail(상세) → 저장/공유/다시 뽑기
```

무료 결과 3줄은 광고 없이 제공하고, 상세 운세·저장·다시 뽑기만 보상형 광고 지점입니다.
홈 진입 직후에는 광고·바텀시트를 띄우지 않습니다(다크패턴 방지).

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입체크 + 프로덕션 빌드 → dist/
npm run preview
```

## 폴더 구조 (PRD §13)

```
src/
  App.tsx                 # 화면 상태 머신 + 광고/토스트 오케스트레이션
  main.tsx
  styles/                 # tokens.css · globals.css
  components/             # AppLayout · BottomAction · FortuneTypeButton
                          # NoteCard · ResultNote · Disclaimer · AdNotice
  screens/                # Home · FortuneType · NotePick · Result · DetailResult
  data/                   # fortuneTypes · notes(12) · resultTemplates · copy
  lib/                    # ads(mock) · dateSeed · generateFortune · storage · share · saveImage
  types/                  # fortune.ts
```

## 콘텐츠 확장

- **쪽지 추가**: `src/data/notes.ts`에 항목 추가 + `resultTemplates.ts`의 `NOTE_LEAD`에 오프닝 한 줄
- **운세 결과 다양화**: `src/data/resultTemplates.ts`의 각 `FortuneType` 배열에 variant 추가 (날짜 seed로 자동 순환)
- **이미지(§9)**: 현재는 이모지 기반. 앱 아이콘/쪽지 3장/결과 카드 배경 이미지를
  `src/assets/`에 추가하고 컴포넌트에서 교체하면 됩니다(초기 버전은 이미지 없이 쪽지 UI부터).

## 앱인토스 배포로 넘어갈 때 (PRD §14 / §15)

프레임워크 독립적 **React + TypeScript + Vite** MVP입니다.

1. `npx create-ait-app tomorrow-note` (template: `react-ts`, TDS: Y, examples: 인앱 광고)
2. `src/` 이식, TDS 컴포넌트로 기본 레이아웃 교체
3. `src/lib/ads.ts`의 mock 을 실제 앱인토스 광고 SDK 호출로 교체
4. `@apps-in-toss/web-framework` 설정(`brand.primaryColor: '#114e48'`)로 `vite.config.ts` 대체
5. 테스트 1회 이상 완료 후 콘솔 검토 요청

## 라이선스

내부 프로토타입.
