import { Component, type ReactNode } from 'react';

// 최후의 안전망 — 어떤 에러에도 흰 화면 대신 복구 화면을 보여준다.
type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="center-hero" style={{ minHeight: '100dvh', padding: 24 }}>
            <div style={{ fontSize: 56 }} aria-hidden>
              💌
            </div>
            <h1 className="h2" style={{ textAlign: 'center' }}>
              앗, 쪽지가 바람에 날아갔어요
            </h1>
            <p className="lead" style={{ textAlign: 'center' }}>
              잠깐 문제가 생겼어요. 다시 열면 괜찮아질 거예요.
            </p>
            <button
              type="button"
              className="btn btn--primary"
              style={{ maxWidth: 280 }}
              onClick={() => window.location.reload()}
            >
              다시 열기
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
