import React from 'react';
import { BatteryLogger } from '../batteryLogger'; // ../batteryLogger のパスを確認してください
import { logger } from '../utils/log';
import { Line } from 'react-chartjs-2'; // グラフ描画用ライブラリをインポート

// ログデータの型定義を追加
interface LogEntry {
    timestamp: number; // タイムスタンプ (ミリ秒)
    batteryLevel: number; // バッテリー残量 (%)
}

const BatteryStats: React.FC = () => {
    const loggerInstance = BatteryLogger.getInstance();
    const logs: LogEntry[] = loggerInstance.getLogs(); // 型を明確に指定

    if (logs.length < 2) {
        logger.info('[BatteryStats] Not enough data to calculate statistics'); // デバッグログ
        return <p>統計情報を計算するには、十分なデータが必要です。</p>;
    }

    // バッテリー消費率を計算
    const consumptionRates = logs.slice(1).map((log, index) => {
        const prevLog = logs[index];
        const timeDiff = (log.timestamp - prevLog.timestamp) / 3600000; // 時間に変換
        const levelDiff = prevLog.batteryLevel - log.batteryLevel;
        return levelDiff / timeDiff; // 消費率 (%/h)
    });

    const avgConsumption = consumptionRates.reduce((a, b) => a + b, 0) / consumptionRates.length;

    // 残り時間を推定
    const currentBatteryLevel = logs[logs.length - 1].batteryLevel;
    const estimatedTimeLeft = avgConsumption > 0 ? currentBatteryLevel / avgConsumption : Infinity; // 消費率が0の場合を考慮

    logger.info('[BatteryStats] Calculated average consumption rate:', avgConsumption); // デバッグログ
    logger.info('[BatteryStats] Estimated time left:', estimatedTimeLeft); // デバッグログ

    // バッテリー残量の推移データを準備
    const chartData = {
        labels: logs.map(log => new Date(log.timestamp).toLocaleTimeString()), // タイムスタンプをラベルに
        datasets: [
            {
                label: 'バッテリー残量 (%)',
                data: logs.map(log => log.batteryLevel),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };

    return (
        <div>
            <h3>バッテリー統計情報</h3>
            <Line data={chartData} />
            <p>平均消費率: {avgConsumption.toFixed(2)} %/h</p>
            <p>推定残り時間: {estimatedTimeLeft.toFixed(2)} 時間</p>
        </div>
    );
};

export default BatteryStats;
