# zmk-battery-center

A system tray app to monitor the battery level of ZMK-based keyboards, built with [Tauri v2](https://v2.tauri.app/).

![image](https://github.com/user-attachments/assets/1fe0b6de-c8cd-428b-975f-8c5d89850aba)

## ✨ Features
- Display battery level for:
  - Both central and peripheral sides of split keyboards
  - Multiple keyboards simultaneously
- Supports macOS and Windows
- (Options)
  - Push notifications when
    - Keyboard battery is low
    - Keyboard is connected/disconnected
  - Auto start at login
  - Switch between light and dark themes

## Download

Download from [Releases](https://github.com/kot149/zmk-battery-center/releases).

## Troubleshooting

### Cannot open the app on macOS

- Remove the app from quarantine by running the following command in the terminal:
  ```sh
  sudo xattr -d com.apple.quarantine /path/to/zmk-battery-center.app
  # typically:
  sudo xattr -d com.apple.quarantine /Applications/zmk-battery-center.app
  ```

### My keyboard does not show up / battery level is not displayed for peripheral side

- Ensure your keyboard is connected to your computer via Bluetooth.
- Confirm your keyboard firmware includes the following ZMK configuration options:
  ```kconfig
  CONFIG_BT_BAS=y
  CONFIG_ZMK_BATTERY_REPORTING=y
  # For split keyboards:
  CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y
  CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y
  ```
  See the ZMK Documentation [about Bluetooth](https://zmk.dev/docs/config/system#bluetooth) and [about battery](https://zmk.dev/docs/config/battery) for more details.
- On macOS, make sure Bluetooth permission is granted to the app.

## Contributing
Issues and PRs are appreciated.

Also, if you like this software, please support the ZMK developer!
https://opencollective.com/zmkfirmware

## Development
1. Install [Bun](https://bun.sh)
1. Install [Rust](https://www.rust-lang.org/ja/tools/install)
1. Install frontend dependencies
     ```sh
     bun install
     ```
2. Run in development mode
     ```sh
     bun tauri dev
     ```
3. Build for production
     ```sh
     bun tauri build
     ```
   - If build fails, try cleaning the build cache
     ```sh
     cd src-tauri
     cargo clean
     cd ..
     ```

You can also build using [GitHub Actions](.github/workflows).

## References
- ZMK PR [#1243](https://github.com/zmkfirmware/zmk/pull/1243), [#2045](https://github.com/zmkfirmware/zmk/pull/2045) — Implementation and discussion for split battery reporting over BLE GATT
- [zmk-ble](https://github.com/Katona/zmk-ble): Proof-of-concept system tray app for macOS (not compatible with latest macOS)
- [Mighty-Mitts](https://github.com/codyd51/Mighty-Mitts): System tray app for macOS
- [zmk-split-battery](https://github.com/Maksim-Isakau/zmk-split-battery): System tray app for Windows
- [zmkBATx](https://github.com/mh4x0f/zmkBATx): System tray app for Linux
