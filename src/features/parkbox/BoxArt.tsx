/** Die gezeichnete Box: Pappkörper, Deckel mit Schlitz und ein paar farbige Zettel, die herausschauen. */
export function BoxArt({ colors, bump, count, label = 'Parkbox', tone = 'park', testId = 'park-box-art', width = 210 }: {
  colors: string[];
  bump?: boolean;
  count: number;
  label?: string;
  tone?: 'park' | 'project';
  testId?: string;
  width?: number;
}) {
  const body = tone === 'project' ? { a: '#8fb98a', b: '#a8cba3', line: '#5f8a5a', slot: '#2f4a2c', label: '#eef7ec', ink: '#2f4a2c' } : { a: '#c8995c', b: '#d6aa6c', line: '#a97a3f', slot: '#6b4a22', label: '#fbf4e4', ink: '#6b4a22' };
  const peek = colors.slice(0, 4);
  return (
    <svg viewBox="0 16 220 134" style={{ width }} className={`mx-auto block overflow-visible ${bump ? 'park-box-bump' : ''}`} role="img" aria-label={label} data-testid={testId} data-count={count}>
      {peek.map((c, i) => (
        <rect key={i} x={50 + i * 34} y={22 - (i % 2) * 6} width="34" height="40" rx="3" fill={c} stroke="rgba(0,0,0,0.18)" transform={`rotate(${(i - 1.5) * 7} ${67 + i * 34} 62)`} />
      ))}
      <path d="M22 62 L198 62 L190 138 Q189 144 183 144 L37 144 Q31 144 30 138 Z" fill={body.a} stroke={body.line} strokeWidth="2" />
      <path d="M22 62 L198 62 L194 92 L26 92 Z" fill={body.b} stroke={body.line} strokeWidth="2" />
      <rect x="64" y="70" width="92" height="9" rx="4.5" fill={body.slot} opacity="0.85" />
      <rect x="70" y="104" width="80" height="24" rx="5" fill={body.label} stroke={body.line} />
      <text x="110" y="121" textAnchor="middle" fontSize="12" fill={body.ink} fontFamily="inherit">{label}</text>
    </svg>
  );
}
