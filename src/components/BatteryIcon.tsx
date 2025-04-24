import React from "react";

interface BatteryIconProps {
  percentage: number; // 0〜100
  className?: string;
  size?: number; // アイコンサイズ(px)
}

const getBatteryColor = (percentage: number) => {
  if (percentage <= 20) return "#ef4444"; // 赤
  if (percentage <= 40) return "#f59e42"; // オレンジ
  return "#22c55e"; // 緑
};

const BatteryIcon: React.FC<BatteryIconProps> = ({ percentage, className = "", size = 28 }) => {

  // バッテリー外枠
  const left = 2;
  const top = 4;
  const frameWidth = size * 0.85;
  const frameHeight = size * 0.48;

  // バッテリー端子部分
  const terminalWidth = size - frameWidth;
  const terminalHeight = frameHeight * 0.5;
  const terminalLeft = left+frameWidth;
  const terminalTop = top + (frameHeight - terminalHeight) / 2;

  // バッテリーの充電部分の幅
  const maxFillWidth = frameWidth * 0.85;
  const padding = (frameWidth - maxFillWidth) / 2;
  const fillWidth = Math.max(0, Math.min(maxFillWidth, maxFillWidth * percentage / 100));
  const fillHeight = frameHeight - padding * 2;
  const fillLeft = left+padding;
  const fillTop = top+padding;
  const color = getBatteryColor(percentage);

  return (
    <svg
      width={size}
      height={frameHeight}
      viewBox="0 0 32 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* バッテリー外枠 */}
      <rect x={left} y={top} width={frameWidth} height={frameHeight} rx="10%" className="stroke-ring stroke-2 fill-none" />
      {/* バッテリー端子 */}
      <rect x={terminalLeft} y={terminalTop} width={terminalWidth} height={terminalHeight} rx="10%" className="fill-ring" />
      {/* バッテリー残量 */}
      <rect x={fillLeft} y={fillTop} width={fillWidth} height={fillHeight} rx="10%" fill={color} />
    </svg>
  );
};

export default BatteryIcon;