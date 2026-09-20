// 태어난 곳 — 진태양시 보정에 쓰는 경도.
//
// 명리는 시계 시각이 아니라 태양의 실제 위치로 시주를 세운다. 한국 표준시는
// 동경 135°를 쓰는데 실제 국토는 126~130°에 있어서, 시계와 해 사이에 30분 안팎의
// 차이가 난다. 그 차이가 지역마다 또 다르다 — 목포와 포항은 12분 벌어진다.
//
// 전원 서울로 계산하면 시주 경계(두 시간마다) 근처에서 태어난 사람의 시주가
// 통째로 한 칸 밀린다. 그래서 태어난 곳을 받는다.
//
// 경도는 각 시의 시청 자리를 기준으로 했다. 한 도시 안의 차이(수 km)는
// 시간으로 1분이 안 되므로 시주를 바꾸지 않는다.

export type BirthPlace = {
  id: string;
  label: string;
  longitude: number;
};

export const BIRTH_PLACES: BirthPlace[] = [
  { id: 'seoul', label: '서울', longitude: 126.978 },
  { id: 'incheon', label: '인천', longitude: 126.705 },
  { id: 'suwon', label: '수원', longitude: 127.009 },
  { id: 'chuncheon', label: '춘천', longitude: 127.734 },
  { id: 'gangneung', label: '강릉', longitude: 128.896 },
  { id: 'cheongju', label: '청주', longitude: 127.489 },
  { id: 'cheonan', label: '천안', longitude: 127.114 },
  { id: 'daejeon', label: '대전', longitude: 127.385 },
  { id: 'jeonju', label: '전주', longitude: 127.148 },
  { id: 'gwangju', label: '광주', longitude: 126.852 },
  { id: 'mokpo', label: '목포', longitude: 126.392 },
  { id: 'yeosu', label: '여수', longitude: 127.662 },
  { id: 'daegu', label: '대구', longitude: 128.601 },
  { id: 'andong', label: '안동', longitude: 128.729 },
  { id: 'pohang', label: '포항', longitude: 129.365 },
  { id: 'ulsan', label: '울산', longitude: 129.311 },
  { id: 'busan', label: '부산', longitude: 129.075 },
  { id: 'changwon', label: '창원', longitude: 128.682 },
  { id: 'jinju', label: '진주', longitude: 128.108 },
  { id: 'jeju', label: '제주', longitude: 126.531 },
];

export const DEFAULT_PLACE_ID = 'seoul';

export function findPlace(id: string | null | undefined): BirthPlace {
  return BIRTH_PLACES.find((p) => p.id === id) ?? BIRTH_PLACES[0];
}

/** 저장된 값이 우리가 아는 곳인지. 모르는 값이면 저장하지 않는다. */
export function isKnownPlace(id: unknown): id is string {
  return typeof id === 'string' && BIRTH_PLACES.some((p) => p.id === id);
}
