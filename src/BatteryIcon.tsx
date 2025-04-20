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

const BatteryIcon: React.FC<BatteryIconProps> = ({ percentage, className = "", size = 32 }) => {
  // バッテリーの充電部分の幅（最大24px）
  const fillWidth = Math.max(0, Math.min(24, Math.round((percentage / 100) * 24)));
  const color = getBatteryColor(percentage);

  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 32 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* バッテリー外枠 */}
      <rect x="2" y="4" width="26" height="12" rx="3" stroke="#ccc" strokeWidth="2" fill="none" />
      {/* バッテリー端子 */}
      <rect x="28" y="8" width="2.5" height="4" rx="1" fill="#ccc" />
      {/* バッテリー残量 */}
      <rect x="4" y="6" width={fillWidth} height="8" rx="2" fill={color} />
    </svg>
  );
};

export default BatteryIcon;