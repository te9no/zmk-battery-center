# zmk-battery-center

A system tray app to monitor the battery level of ZMK-based keyboards, built with [Tauri v2](https://v2.tauri.app/).

![image](https://github.com/user-attachments/assets/1fe0b6de-c8cd-428b-975f-8c5d89850aba)

## ✨ Features
- Display battery level for:
  - Both central and peripheral sides of split keyboards
  - Multiple keyboards simultaneously
- Supports macOS and Windows
- Options to
  - Push notifications when
    - Keyboard battery is low
    - Keyboard is connected/disconnected
  - Auto start at login
  - Switch between light and dark themes

## Download

Download from [Releases](https://github.com/kot149/zmk-battery-center/releases).

## Troubleshooting

### Cannot open the app on macOS

- Remove the app from quarantine by running `sudo xattr -d com.apple.quarantine /path/to/zmk-battery-center.app` in the terminal and try again.

### My keyboard does not show up

- Ensure your keyboard is connected to your computer via Bluetooth.
- Confirm your keyboard firmware includes the following ZMK configuration options:
  ```kconfig
  CONFIG_ZMK_BATTERY_REPORTING=y
  # For split keyboards:
  CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y
  CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y
  ```
  See the [ZMK Battery Documentation](https://zmk.dev/docs/config/battery) for more details.
- On macOS, make sure Bluetooth permissions are granted to the app.

## References
- ZMK PR [#1243](https://github.com/zmkfirmware/zmk/pull/1243), [#2045](https://github.com/zmkfirmware/zmk/pull/2045) — Implementation and discussion for split battery reporting over BLE GATT
- [zmk-ble](https://github.com/Katona/zmk-ble): Proof-of-concept system tray app for macOS (not compatible with latest macOS)
- [Mighty-Mitts](https://github.com/codyd51/Mighty-Mitts): System tray app for macOS
- [zmk-split-battery](https://github.com/Maksim-Isakau/zmk-split-battery): System tray app for Windows
- [zmkBATx](https://github.com/mh4x0f/zmkBATx): System tray app for Linux
