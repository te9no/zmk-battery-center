import { RegisteredDevice } from '../App';

export const mockRegisteredDevices: RegisteredDevice[] = [
    {
        id: 'normal',
        name: 'Normal',
        batteryInfos: [
            { user_descriptor: 'Central', battery_level: 65 }
        ],
        isDisconnected: false
    },
    {
        id: 'split',
        name: 'Split',
        batteryInfos: [
            { user_descriptor: 'Central', battery_level: 100 },
            { user_descriptor: 'Peripheral 0', battery_level: 1 }
        ],
        isDisconnected: false
    },
    {
        id: 'manyperipherals',
        name: 'Many Peripherals',
        batteryInfos: [
            { user_descriptor: 'Central', battery_level: 0 },
            { user_descriptor: 'Peripheral 0', battery_level: 20 },
            { user_descriptor: 'Peripheral 1', battery_level: 40 },
            { user_descriptor: 'Peripheral 2', battery_level: 50 },
            { user_descriptor: 'Peripheral 3', battery_level: 60 },
            { user_descriptor: 'Peripheral 4', battery_level: 80 },
            { user_descriptor: 'Peripheral 5', battery_level: 100 }
        ],
        isDisconnected: false
    },
    {
        id: 'longname',
        name: 'Keyboard with Long Name',
        batteryInfos: [
            { user_descriptor: 'Central', battery_level: 85 },
            { user_descriptor: 'Peripheral 0', battery_level: 72 }
        ],
        isDisconnected: false
    },
];
