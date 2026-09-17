import { splitSentences } from '../lib/sentences.ts';

type Props = { text: string; className?: string };

// 한 문장에 한 줄. 두 문장 이상일 때만 쪼갠다.
export function Sentences({ text, className }: Props) {
  const lines = splitSentences(text);
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
