import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'app.log');

// ログファイルを初期化
fs.writeFileSync(LOG_FILE, ''); // 起動時にログファイルをクリア

export const logger = {
    info: (message: string, data?: any) => {
        const logMessage = `[INFO] ${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}\n`;
        try {
            fs.appendFileSync(LOG_FILE, logMessage);
        } catch (err) {
            console.error(`[Logger Error] Failed to write log: ${err}`);
        }
        console.log(logMessage.trim());
    },
    error: (message: string, data?: any) => {
        const logMessage = `[ERROR] ${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}\n`;
        try {
            fs.appendFileSync(LOG_FILE, logMessage);
        } catch (err) {
            console.error(`[Logger Error] Failed to write log: ${err}`);
        }
        console.error(logMessage.trim());
    },
    debug: (message: string, data?: any) => {
        const logMessage = `[DEBUG] ${new Date().toISOString()} - ${message} ${data ? JSON.stringify(data) : ''}\n`;
        try {
            fs.appendFileSync(LOG_FILE, logMessage);
        } catch (err) {
            console.error(`[Logger Error] Failed to write log: ${err}`);
        }
        console.debug(logMessage.trim());
    },
};
