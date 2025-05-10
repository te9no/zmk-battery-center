import React from 'react';
import { BatteryLogger } from '../batteryLogger';

const BatteryStats: React.FC = () => {
    const logger = BatteryLogger.getInstance();
    const logs = logger.getLogs();

    if (logs.length < 2) {
        return <p>統計情報を計算するには、十分なデータが必要です。</p>;
    }

    const consumptionRates = logs.slice(1).map((log, index) => {
        const prevLog = logs[index];
        const timeDiff = (log.timestamp - prevLog.timestamp) / 3600000; // 時間に変換
        const levelDiff = prevLog.batteryLevel - log.batteryLevel;
        return levelDiff / timeDiff; // 消費率 (%/h)
    });

    const avgConsumption = consumptionRates.reduce((a, b) => a + b, 0) / consumptionRates.length;

    return (
        <div>
            <h3>統計情報</h3>
            <p>平均消費率: {avgConsumption.toFixed(2)} %/h</p>
        </div>
    );
};

export default BatteryStats;
