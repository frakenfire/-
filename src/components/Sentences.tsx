import { lineGroups } from '../lib/sentences.ts';

type Props = { text: string; className?: string };

// 뜻이 바뀌는 자리(그래서, 다만, 한편 앞)에서만 줄을 바꾼다. 문장마다 끊으면 시처럼 보인다.
export function Sentences({ text, className }: Props) {
  const lines = lineGroups(text);
  if (lines.length <= 1) return <p className={className}>{text}</p>;
  return (
    <p className={className}>
      {lines.map((line) => (
        <span key={line} className="sent">
          {line}
        </span>
      ))}
    </p>
  );
}
