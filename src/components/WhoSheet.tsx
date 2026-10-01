// 쪽지를 열 때, 넣어둔 정보로 볼지 새로 넣을지 묻는 아래 시트.
// 홈 구석에 '다른 사람 보기' 링크를 두면 아무도 못 찾는다(실기기 지적).
// 여는 순간에 한 번 묻는 게 토스 앱이 하는 방식이다.
type Props = {
  name: string;
  detail: string;
  onUseSaved: () => void;
  onNew: () => void;
  onClose: () => void;
};

export function WhoSheet({ name, detail, onUseSaved, onNew, onClose }: Props) {
  return (
    <div className="who-sheet" role="dialog" aria-modal="true" aria-labelledby="who-sheet-title" onClick={onClose}>
      <div className="who-sheet__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="who-sheet__title" id="who-sheet-title">
          {name}님 정보로 볼까요?
        </h2>
        <p className="who-sheet__sub">{detail}</p>
        <button type="button" className="btn btn--primary" onClick={onUseSaved}>
          {name}님으로 볼게요
        </button>
        <button type="button" className="btn btn--weak" onClick={onNew}>
          다른 사람 정보 새로 입력할게요
        </button>
      </div>
    </div>
  );
}
