# 오늘쪽지 뽑기 (tomorrow-note)

토스 **앱인토스(Apps in Toss)** 웹뷰용 **무비용·광고형 가벼운 운세 쪽지 미니앱** MVP.
보고 싶은 운세(오늘의 나 · 이번 달의 나 · 연애운 · 금전운 · 직장운 · 조심할 것 · 행운 포인트)를 고르고
접힌 쪽지 한 장을 뽑으면 **기분에 맞춘 오늘(이번 달) 설계 + 행운 보고서 + 하루 풀이**를 받고 저장·공유할 수 있어요.
**실제 생성형 AI / 서버 / DB / 로그인 없이** 선택값·쪽지 데이터·날짜 seed 조합으로 동작합니다.

## 핵심 원칙

- **AI API 호출 없음** — 결과는 `fortuneType + note + dateSeed + mood` 조합 (`src/lib/generateFortune.ts`)
- **서버/DB/로그인 없음** — 상태는 React state, 기록은 `localStorage`(선택형 값만)
- **개인정보/자유입력 저장 없음** (`src/lib/storage.ts`) — 띠도 생년월일 없이 선택형 값만
- **가볍고 희망적인 톤, 해요체** — 의료/금융/법률 조언 및 단정·불안 표현 금지
- **광고는 mock** — `Promise<boolean>` mock (`src/lib/ads.ts`), 실배포 시 앱인토스 광고 SDK로 교체
- **디자인** — 화이트 캔버스 + 토스 그레이 램프(`#191f28`~`#f9fafb`) + 토스 블루 `#3182f6`(브랜드/CTA),
  세만틱 컬러(초록/블루/앰버)로 점수 표현, 20~24px 라운드, 단일 레이어 소프트 섀도우
- **쪽지/별/스티커 느낌의 가벼운 뽑기 UI** — 무거운 명상/타로/무속 느낌 배제

## 화면 흐름

```
Home → Mood(기분 선택) → NotePick(쪽지 3장 중 1장) → Reveal(로딩) → Result(하루 설계) → Detail(심층 리포트)
                                                                                └→ Compat(친구 궁합)
```

결과 화면이 메인 콘텐츠(기분 맞춤 하루 설계 + 행운 보고서 + 하루 풀이)이고,
심층 리포트·결과 카드 저장·다른 쪽지 뽑기·친구 궁합이 보상형 광고 지점입니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입체크 + 프로덕션 빌드 → dist/
npm run preview
```

## 폴더 구조

```
src/
  App.tsx                 # 화면 상태 머신 + 광고/토스트 오케스트레이션
  main.tsx
  styles/                 # tokens.css · globals.css
  components/             # AppLayout · Mascot · LetterCard · CategoryScores · LuckySet 등
  screens/                # Home · Mood · NotePick · Reveal · Result · DetailResult · Compat
  data/                   # fortuneTypes · notes(12) · resultTemplates · dayDesign · readings
                          # detailContent · luckyFood · zodiac · letterFragments · copy
  lib/                    # generateFortune · luck · detail · compat · dayVibe · letter · rarity
                          # ads(mock) · dateSeed · storage · share · saveImage
  types/                  # fortune.ts
```

## 핵심 콘텐츠 구조

### 1. 기분 맞춤 하루 설계 (결과의 주인공)
`src/data/dayDesign.ts` — **운세 종류 × 상태(up/flat/down)** 매트릭스로 42개 설계.
- 운세 종류가 주제와 시간 척도를 결정: **이번 달만 초반/중순/월말(→ 주차별)**, 나머지는 아침/낮/저녁
- 상태(기분 5종 → 3그룹)가 톤을 결정: 기분 좋음=과속 방지·나눔, 보통=작은 실행, 지침/불안/외로움=회복·안정
- 각 설계는 헤드라인(공감 문장) + 시간대별 3단계 + "오늘은 접어둬요"로 구성

### 2. 오늘의 기운 (홈↔결과 연결)
`src/lib/dayVibe.ts` — 날짜만으로 정해지는 하루 키워드(정리/연결/회복 등). 홈의 "오늘의 기운"과
결과 화면 칩에 동일하게 노출돼 화면 간 단절 없이 이어짐. (이번 달 결과에서는 오늘/이번달 모순 방지를 위해 숨김)

### 3. 오늘의 행운 보고서
`src/lib/luck.ts` — 타이밍·행운 색·행운 음식(하루) / 행운의 주·이달의 색·이달의 키워드(이번 달).
색은 토스 팔레트에 맞춰 톤다운, 형광색 배제.

### 4. 심층 리포트 (광고 보상 페이지)
`src/lib/detail.ts` — 항목별 운세를 순위+해석으로(원픽/살살 갈 운), 행운 세트를 "오늘의 행운 미션"
하나로 묶고, 오늘 잘 맞는 띠, 캡처하고 싶은 "오늘의 부적" 문장까지.

### 5. 친구 궁합 (로그인 없는 바이럴 훅)
`src/lib/compat.ts` + `CompatScreen.tsx` — 내 띠 × 상대 띠로 결정적 궁합 점수/코멘트.
"공유하고 열기"(바이럴)와 "광고 보고 열기"(수익) 두 갈래로 잠금 해제, 결과는 친구에게 자랑 공유.

### 6. 쪽지 요정의 편지 (선택적 감성 레이어)
`src/lib/letter.ts` + `data/letterFragments.ts` — 인사×공감×이음말×맺음을 조합한 손편지.
결과 화면에서 원하는 사람만 펼쳐 읽는 보조 콘텐츠(주 콘텐츠는 하루 설계).

### 7. 총운 상위 % 자랑 배지
`src/lib/luck.ts`의 `luckPercentile` — 점수가 좋을수록 "오늘 총운 상위 N%"로 자랑 공유 유도.

## 결과 다양성

결과는 `fortuneType(7) × note(12) × mood(5) × dateSeed` 조합으로 생성됩니다.
행운 세트(색 10 × 숫자 45 × 방향 7 × 시간 6 × 음식 18 × 총운 35) + 하루 설계(42) + 풀이(각 12개 풀)까지
곱해지면 **사실상 매 뽑기가 고유한 결과**가 됩니다.
seed(운세·쪽지·기분·날짜)가 결과의 뼈대를 결정합니다. 다만 결과 템플릿·풀이·하루
설계 등 **일부 문구는 직전 회피(`pickFresh`) 로직**으로 "바로 직전에 본 것"을 피해
돌아가므로, 같은 seed라도 직전 열람 이력에 따라 문구가 달라질 수 있습니다(반복 피로
감소 목적). 궁합(`compat.ts`/`starCompat.ts`)은 직전 회피를 쓰지 않아 같은 날 같은
쌍이면 항상 같은 결과 — 공유·스크린샷 재현이 필요한 곳에만 완전 결정론을 유지합니다.

## 콘텐츠 확장

- **쪽지 추가**: `src/data/notes.ts` + `resultTemplates.ts`의 `NOTE_LEAD`에 오프닝 한 줄
- **운세 결과 다양화**: `src/data/resultTemplates.ts`의 각 `FortuneType` 배열에 variant 추가
- **하루 설계 확장**: `src/data/dayDesign.ts`의 `PLANS[type][state]` 배열에 항목 추가
- **이미지**: 현재는 이모지 기반. 앱 아이콘/쪽지 배경 이미지를 `src/assets/`에 추가 후 컴포넌트 교체

## 앱인토스 배포로 넘어갈 때

프레임워크 독립적 **React + TypeScript + Vite** MVP입니다. `release/LAUNCH.md` 참고.

## 라이선스

내부 프로토타입.
