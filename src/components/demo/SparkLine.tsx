// SparkLine — tiny SVG line chart used inside KPI cards.
//
// Pure presentational, server-renderable. Accepts a series of
// numbers (e.g. 7-day revenue), normalizes to its own bounding box,
// and draws a soft baseline + the trend stroke + an area fill
// underneath. No axes, no labels — the value is the shape.

type Props = {
  /** Time-series values. Length 5-30 reads best at this size. */
  values: number[];
  /** Rendered pixel width. Defaults 120. */
  width?: number;
  /** Rendered pixel height. Defaults 32. */
  height?: number;
  /** Brand-leaning stroke + fill. "ink" = neutral graphite,
   *  "brand" = brand red, "emerald" = healthy/positive. */
  tone?: "ink" | "brand" | "emerald";
};

export function SparkLine({
  values,
  width = 120,
  height = 32,
  tone = "ink",
}: Props) {
  if (values.length < 2) {
    // Render a flat baseline so the slot stays sized even on
    // empty data — avoids layout shift.
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-hidden
        className="block"
      >
        <line
          x1="0"
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const padY = 2;

  // Normalize each point.
  const points = values.map((v, i) => {
    const x = i * stepX;
    const yNorm = (v - min) / range;
    const y = height - padY - yNorm * (height - padY * 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const stroke =
    tone === "brand" ? "#E11D2A" : tone === "emerald" ? "#10b981" : "#1d1d1f";
  const fill =
    tone === "brand"
      ? "rgba(225,29,42,0.10)"
      : tone === "emerald"
        ? "rgba(16,185,129,0.10)"
        : "rgba(29,29,31,0.08)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
      className="block"
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
