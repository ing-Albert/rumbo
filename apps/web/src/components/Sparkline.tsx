export function Sparkline({
  values,
  width = 260,
  height = 48
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pointFor = (value: number, index: number) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  };
  const points = values.map((value, index) => {
    const { x, y } = pointFor(value, index);
    return `${x},${y}`;
  });
  const last = pointFor(values[values.length - 1]!, values.length - 1);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="sparkline"
      role="presentation"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--info)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="4" fill="var(--accent)" />
    </svg>
  );
}
