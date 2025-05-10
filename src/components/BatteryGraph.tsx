import React from 'react';
import { Line } from 'react-chartjs-2';
import { BatteryLogger } from '../batteryLogger';

const BatteryGraph: React.FC = () => {
    const logger = BatteryLogger.getInstance();
    const logs = logger.getLogs();

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

    return <Line data={data} />;
};

export default BatteryGraph;
