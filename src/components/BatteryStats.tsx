import React from 'react';
import { BatteryLogger } from '../batteryLogger';
import { logger } from '../utils/log';

const BatteryStats: React.FC = () => {
    const loggerInstance = BatteryLogger.getInstance();
    const logs = loggerInstance.getLogs();

    if (logs.length < 2) {
        logger.info('[BatteryStats] Not enough data to calculate statistics'); // デバッグログ
        return <p>統計情報を計算するには、十分なデータが必要です。</p>;
    }

    const consumptionRates = logs.slice(1).map((log, index) => {
        const prevLog = logs[index];
        const timeDiff = (log.timestamp - prevLog.timestamp) / 3600000; // 時間に変換
        const levelDiff = prevLog.batteryLevel - log.batteryLevel;
        return levelDiff / timeDiff; // 消費率 (%/h)
    });

    const avgConsumption = consumptionRates.reduce((a, b) => a + b, 0) / consumptionRates.length;

    logger.info('[BatteryStats] Calculated average consumption rate:', avgConsumption); // デバッグログ

    return (
        <div>
            <h3>統計情報</h3>
            <p>平均消費率: {avgConsumption.toFixed(2)} %/h</p>
        </div>
    );
};

export default BatteryStats;
