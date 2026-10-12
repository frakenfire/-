import { splitSentences } from '../lib/sentences.ts';

type Props = { text: string; className?: string };

// 문장이 끝나면 줄을 바꾼다. 여러 문장을 한 덩이로 흘리면 답답해 보여서
// 전부 흘려 읽는다(사장님). 한 문장이 한 줄이다.
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
