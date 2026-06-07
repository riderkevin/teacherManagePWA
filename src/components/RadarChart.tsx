// ── 简易 SVG 雷达图组件 ──

interface Dimension {
  label: string
  value: number // 0-10
}

interface Props {
  dimensions: Dimension[]
  size?: number
}

export default function RadarChart({ dimensions, size = 260 }: Props) {
  const count = dimensions.length
  if (count < 3) return null

  const cx = size / 2
  const cy = size / 2
  const radius = (size / 2) - 36 // 给标签留空间
  const levels = 5 // 5 圈刻度

  // 计算顶点坐标
  const getPoint = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  // 刻度多边形
  const levelPolygons = Array.from({ length: levels }, (_, i) => {
    const r = (radius * (i + 1)) / levels
    return Array.from({ length: count }, (_, j) => {
      const p = getPoint(j, r)
      return `${p.x},${p.y}`
    }).join(' ')
  })

  // 数据多边形
  const dataPoints = Array.from({ length: count }, (_, i) => {
    const r = (radius * Math.min(dimensions[i].value, 10)) / 10
    return getPoint(i, r)
  })
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  // 轴线: 中心到每个顶点
  const axes = Array.from({ length: count }, (_, i) => {
    const outer = getPoint(i, radius)
    return { x1: cx, y1: cy, x2: outer.x, y2: outer.y }
  })

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[260px] h-auto mx-auto"
    >
      {/* 刻度圈 */}
      {levelPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={i === levels - 1 ? '#cbd5e1' : '#e2e8f0'}
          strokeWidth={i === levels - 1 ? 1.5 : 0.5}
        />
      ))}

      {/* 轴线 */}
      {axes.map((a, i) => (
        <line key={i} {...a} stroke="#e2e8f0" strokeWidth="0.5" />
      ))}

      {/* 数据区域 */}
      <polygon
        points={dataPolygon}
        fill="rgba(37, 99, 235, 0.15)"
        stroke="rgb(37, 99, 235)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 数据点 */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="white"
          stroke="rgb(37, 99, 235)"
          strokeWidth="2"
        />
      ))}

      {/* 标签 */}
      {dimensions.map((d, i) => {
        const labelPos = getPoint(i, radius + 20)
        return (
          <text
            key={i}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-600"
            style={{ fontSize: '11px' }}
          >
            {d.label}
          </text>
        )
      })}

      {/* 数值标注 */}
      {dataPoints.map((p, i) => (
        <text
          key={`val-${i}`}
          x={p.x}
          y={p.y - 10}
          textAnchor="middle"
          className="fill-blue-700 font-semibold"
          style={{ fontSize: '10px' }}
        >
          {dimensions[i].value}
        </text>
      ))}
    </svg>
  )
}
