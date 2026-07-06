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

## 폰트 · 완성도

- **Pretendard(제품용 한글 UI 폰트) self-host**: `pretendard` 패키지의 **다이나믹 서브셋**
  (`pretendardvariable-dynamic-subset.css`)을 import → `unicode-range`로 화면에 실제 쓰이는
  글자만 런타임에 로드(홈 기준 woff2 7개 ≈ 300KB), CSP 안전. 시스템 폰트 폴백으로 깨지지 않음.
- **숫자 강조**: 점수·수치에 tabular numeral(`font-num`) 적용(토스식 수치 강조).
- **홈 개편**: 진입 즉시 7개 운세를 카드로 노출(탭 최소화·breadth 노출) + 받는 가치(총운/항목별/행운세트) 카피 + 날짜 pill.
- **쪽지 뽑기**: 살짝 기울인 배치 + 순차 등장 애니메이션으로 뽑는 재미.
- `word-break: keep-all`로 한글 줄바꿈 어색함 방지.

## 토스 스타일 · 입소문 요소 (인기 운세앱 리서치 반영)

포스텔러(누적 860만, MZ 83%)·펭귄도사·운세도사 등 잘 되는 '오늘의 운세' 앱의
공통 히트 요소와 토스 TDS의 조형 언어를 반영했습니다.

- **토스 스타일 디자인**: 화이트 캔버스 + 토스 그레이 램프(`#191f28`~`#f9fafb`) + 차콜 헤딩,
  큰 볼드 숫자, 넉넉한 여백, 20~24px 라운드, 단일 레이어 소프트 섀도우. Primary는 브랜드 `#114e48` 유지.
- **몽글 로딩 연출**(`RevealScreen`) — "쪽지들을 살살 뒤섞고 있어요…" 운세별 단계 멘트 + 마스코트 바운스. 기대감을 만들고 결과 몰입도를 높임
- **연속 출석 스트릭** — "🔥 N일째 쪽지" 배지(localStorage), 첫날은 "🌱 오늘의 첫 쪽지". 매일 재방문 장치
- **점수 카운트업** — 총운이 0→N으로 차오르고 등급이 팝. 고득점(88+)엔 색종이 축하
- **시간대별 인사** + 결과 하단 "내일 또 봐요 👋" 재방문 넛지
- **콕 집은 한마디**(`pinpoint`) — 구체적·2인칭·타이밍으로 "맞는다" 느낌을 주는 훅. 결과 최상단 노출
- **쪽지 요정 마스코트**(`Mascot`) — 손으로 그린 인라인 SVG(무의존·CSP 안전·벡터). 홈 히어로 브랜딩
- **총운 점수 링 게이지** (`ScoreRing`) — 점수대별 색상(초록/파랑/앰버) + 등급(대길·길·순조…)
- **항목별 운세 바** (`CategoryScores`) — 애정·재물·직장·건강 4종 점수 시각화
- **행운 세트** (`LuckySet`) — 색·숫자·방향·시간·아이템. 매 뽑기마다 조합이 달라짐
- **무료→상세 확장(expand-on-demand)**: 무료는 총운+3줄, 상세(광고)에서 항목별·행운세트 공개
- **공유 최적화**: 점수를 앞세운 공유 텍스트 + 세로 결과 카드(PNG)

### 결과 다양성(입소문 엔진)

결과는 `fortuneType(7) × note(12) × 텍스트 variant(3) × 행운세트 조합`으로 생성됩니다.
행운 세트만으로도 색(10) × 숫자(45) × 방향(7) × 시간(6) × 아이템(10) × 총운(35) × 항목점수… →
**사실상 매 뽑기가 고유한 결과**가 되어 공유·재방문을 유도합니다.
같은 (운세·쪽지·날짜) 조합은 항상 같은 결과라 공유 링크/스샷이 안정적으로 재현됩니다.
(`src/lib/luck.ts` — seed 기반 결정적 계산)

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
