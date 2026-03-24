'use client';

/**
 * HeatmapCalendar — GitHub-style activity heatmap
 * 
 * Shows a grid of squares, one per day, colored by activity intensity.
 * Green = more minutes studied that day.
 * 
 * Props:
 *   data: [{ entry_date: '2026-01-15', total_minutes: 45 }, ...]
 *   days: number of days to show (default 365)
 */

const INTENSITY_COLORS = [
  '#EBEDF0',  // 0: no activity
  '#9BE9A8',  // 1: light (1-30 min)
  '#40C463',  // 2: medium (31-60 min)
  '#30A14E',  // 3: good (61-120 min)
  '#216E39',  // 4: strong (121+ min)
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['','Mon','','Wed','','Fri',''];

function getIntensity(minutes) {
  if (!minutes || minutes <= 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 3;
  return 4;
}

export default function HeatmapCalendar({ data = [], days = 365 }) {
  // Build a map of date → minutes
  const dateMap = {};
  data.forEach(d => {
    const dateStr = new Date(d.entry_date).toISOString().split('T')[0];
    dateMap[dateStr] = (dateMap[dateStr] || 0) + Number(d.total_minutes || 0);
  });

  // Generate grid: 52 weeks × 7 days
  const today = new Date();
  const cells = [];

  // Start from (days) ago, aligned to Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  // Align to previous Sunday
  start.setDate(start.getDate() - start.getDay());

  const current = new Date(start);
  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0];
    const minutes = dateMap[dateStr] || 0;
    cells.push({
      date: dateStr,
      minutes,
      intensity: getIntensity(minutes),
      dayOfWeek: current.getDay(),
      month: current.getMonth(),
      isToday: dateStr === today.toISOString().split('T')[0],
    });
    current.setDate(current.getDate() + 1);
  }

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];
  cells.forEach(cell => {
    if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(cell);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIdx) => {
    const firstDay = week[0];
    if (firstDay && firstDay.month !== lastMonth) {
      monthLabels.push({ month: MONTHS[firstDay.month], weekIdx });
      lastMonth = firstDay.month;
    }
  });

  const cellSize = 13;
  const cellGap = 3;
  const labelWidth = 30;
  const totalWidth = labelWidth + weeks.length * (cellSize + cellGap);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalWidth} height={140} style={{ display: 'block' }}>
        {/* Month labels */}
        {monthLabels.map((ml, i) => (
          <text
            key={i}
            x={labelWidth + ml.weekIdx * (cellSize + cellGap)}
            y={10}
            style={{ fontSize: 11, fill: '#888', fontFamily: 'inherit' }}
          >
            {ml.month}
          </text>
        ))}

        {/* Day labels (Mon, Wed, Fri) */}
        {DAYS.map((label, i) => (
          <text
            key={i}
            x={0}
            y={22 + i * (cellSize + cellGap) + cellSize - 2}
            style={{ fontSize: 10, fill: '#aaa', fontFamily: 'inherit' }}
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, weekIdx) => (
          week.map(cell => (
            <rect
              key={cell.date}
              x={labelWidth + weekIdx * (cellSize + cellGap)}
              y={18 + cell.dayOfWeek * (cellSize + cellGap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={INTENSITY_COLORS[cell.intensity]}
              stroke={cell.isToday ? '#333' : 'none'}
              strokeWidth={cell.isToday ? 1.5 : 0}
            >
              <title>{cell.date}: {cell.minutes} min</title>
            </rect>
          ))
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, paddingLeft: labelWidth }}>
        <span style={{ fontSize: 11, color: '#888', marginRight: 4 }}>Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} style={{ width: cellSize, height: cellSize, borderRadius: 2, background: color }} />
        ))}
        <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>More</span>
      </div>
    </div>
  );
}
