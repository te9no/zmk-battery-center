import React from 'react';
import { Line } from 'react-chartjs-2';
import { BatteryLogger } from '../batteryLogger';
import { logger } from '../utils/log';

const BatteryGraph: React.FC = () => {
    const loggerInstance = BatteryLogger.getInstance();
    const logs = loggerInstance.getLogs();

    logger.info('[BatteryGraph] Retrieved logs:', logs); // デバッグログ

    const data = {
        labels: logs.map(log => new Date(log.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: 'Battery Level (%)',
                data: logs.map(log => log.batteryLevel),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    };

    logger.info('[BatteryGraph] Chart data prepared:', data); // デバッグログ

    return (
        <div>
            <h2>Battery Level Over Time</h2>
            <Line data={data} />
        </div>
    );
};

export default BatteryGraph;
