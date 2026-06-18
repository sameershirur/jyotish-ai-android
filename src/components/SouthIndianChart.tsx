import React from "react";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import type { BirthChart } from "@/lib/astrology/types";
import { SIGNS } from "@/lib/astrology/types";

type Props = { chart: BirthChart };

// Fixed-sign 4x4 grid layout, same convention as the web KundliChart South Indian view.
const SI_GRID: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3],
  [3, 2], [3, 1], [3, 0], [2, 0], [1, 0], [0, 0],
];

const PLANET_ABBR: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

export default function SouthIndianChart({ chart }: Props) {
  const cell = 80;
  const total = cell * 4;
  const lagnaIdx = chart.ascendant.signIndex;

  const bySign: Record<number, string[]> = {};
  for (const p of chart.planets) {
    if (!bySign[p.signIndex]) bySign[p.signIndex] = [];
    bySign[p.signIndex].push(PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2));
  }

  return (
    <Svg viewBox={`0 0 ${total} ${total}`} width={total} height={total}>
      {SI_GRID.map(([row, col], signIdx) => {
        const x = col * cell;
        const y = row * cell;
        const isLagna = signIdx === lagnaIdx;
        const planets = bySign[signIdx] ?? [];
        return (
          <React.Fragment key={signIdx}>
            <Rect
              x={x} y={y} width={cell} height={cell}
              fill={isLagna ? "#fef3c7" : "#1e1b4b"}
              stroke="#6366f1"
              strokeWidth={isLagna ? 2 : 1}
            />
            <SvgText x={x + 4} y={y + 13} fontSize={9} fill={isLagna ? "#78350f" : "#818cf8"}>
              {SIGNS[signIdx].slice(0, 6)}
            </SvgText>
            {isLagna && (
              <SvgText x={x + cell - 4} y={y + 13} fontSize={8} fill="#d97706" textAnchor="end">
                Lagna
              </SvgText>
            )}
            {planets.map((abbr, i) => (
              <SvgText
                key={abbr + i}
                x={x + 4}
                y={y + 30 + i * 14}
                fontSize={11}
                fontWeight="600"
                fill={isLagna ? "#92400e" : "#fbbf24"}
              >
                {abbr}
              </SvgText>
            ))}
          </React.Fragment>
        );
      })}
      <Rect x={cell} y={cell} width={cell * 2} height={cell * 2} fill="#0f0a2e" stroke="#6366f1" strokeWidth={1} />
      <SvgText x={total / 2} y={total / 2 - 8} textAnchor="middle" fontSize={13} fontWeight="700" fill="#a78bfa">
        Om
      </SvgText>
      <SvgText x={total / 2} y={total / 2 + 10} textAnchor="middle" fontSize={9} fill="#6366f1">
        Janma Kundli
      </SvgText>
    </Svg>
  );
}
