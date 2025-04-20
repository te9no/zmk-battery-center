# zmk-battery-center

A system tray app to monitor battery status of zmk-based keyboards.

## Features
- Show battery status of both central and peripheral for split keyboards
- Show battery status of multiple keyboards
- Support both Mac and Windows

## Usage

1. Download the latest release from [Releases](https://github.com/kot149/zmk-battery-center/releases).
2. Install or execute the app
3. Click the icon in system tray
4. Click `Add Device` button and select your keyboard

## Trouble Shooting

### My keyboard does not show up

- Make sure your keyboard is connected to your computer via Bluetooth.
- Make sure your keyboard has the following ZMK configs enabled:
  ```kconfig
  CONFIG_ZMK_BATTERY_REPORTING=y
  # for split keyboards:
  CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y
  CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y
  ```
  Refer to [ZMK Docs](https://zmk.dev/docs/config/battery) for more details.
- If you are on macOS, make sure the Bluetooth permission is granted.

## Reference
- [zmk-ble](https://github.com/Katona/zmk-ble): PoC tray app for macOS
- [zmk-split-battery](https://github.com/Maksim-Isakau/zmk-split-battery): Tray app for Windows
- ZMK PR [#1243](https://github.com/zmkfirmware/zmk/pull/1243), [#2045](https://github.com/zmkfirmware/zmk/pull/2045): Implementation and discussion for split battery reporting over BLE GATT
