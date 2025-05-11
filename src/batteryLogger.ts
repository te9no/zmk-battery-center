interface LogEntry {
    timestamp: number; // タイムスタンプ (ミリ秒)
    batteryLevel: number; // バッテリー残量 (%)
}

export class BatteryLogger {
    private static instance: BatteryLogger;
    private logs: LogEntry[] = [];

    private constructor() {}

    public static getInstance(): BatteryLogger {
        if (!BatteryLogger.instance) {
            BatteryLogger.instance = new BatteryLogger();
        }
        return BatteryLogger.instance;
    }

    public addLog(entry: LogEntry): void {
        this.logs.push(entry);
    }

    public getLogs(): LogEntry[] {
        return this.logs;
    }

    public clearLogs(): void {
        this.logs = [];
    }
}
