# zmk-battery-center

A system tray app to monitor battery level of zmk-based keyboards.

## ✨Features
- Show battery level of
  - both central and peripheral for split keyboards
  - multiple keyboards
- Cross-platform(macOS, Windows)
  - Perhaps also compatible with Linux, but not tested

## Usage

1. Download the latest release from [Releases](https://github.com/kot149/zmk-battery-center/releases).
2. Install/execute the app
3. Click the icon in system tray
4. Click `Add Device` button and select your keyboard
   - Grant the Bluetooth permission if you are on macOS

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
- ZMK PR [#1243](https://github.com/zmkfirmware/zmk/pull/1243), [#2045](https://github.com/zmkfirmware/zmk/pull/2045): Implementation and discussion for split battery reporting over BLE GATT
- [zmk-ble](https://github.com/Katona/zmk-ble): PoC system tray app for macOS (does not work on latest macOS)
- [Mighty-Mitts](https://github.com/codyd51/Mighty-Mitts): System tray app for macOS
- [zmk-split-battery](https://github.com/Maksim-Isakau/zmk-split-battery): System tray app for Windows
- [zmkBATx](https://github.com/mh4x0f/zmkBATx): System tray app for Linux
