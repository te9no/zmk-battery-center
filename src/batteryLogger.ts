import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, '../data/battery-log.json');

export interface BatteryLogEntry {
    timestamp: number;
    batteryLevel: number;
}

export class BatteryLogger {
    private static instance: BatteryLogger;

    private constructor() {}

    static getInstance(): BatteryLogger {
        if (!BatteryLogger.instance) {
            BatteryLogger.instance = new BatteryLogger();
        }
        return BatteryLogger.instance;
    }

    logBatteryLevel(batteryLevel: number): void {
        const entry: BatteryLogEntry = {
            timestamp: Date.now(),
            batteryLevel,
        };

        const logs = this.getLogs();
        logs.push(entry);

        fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    }

    getLogs(): BatteryLogEntry[] {
        if (!fs.existsSync(LOG_FILE)) {
            return [];
        }
        const data = fs.readFileSync(LOG_FILE, 'utf-8');
        return JSON.parse(data) as BatteryLogEntry[];
    }
}
