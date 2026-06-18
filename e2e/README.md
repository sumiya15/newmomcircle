# NewMomCircle — Enterprise Appium E2E Automation Framework

Production-ready Android E2E test automation using **Appium 2.x**, **WebdriverIO**, **Mocha + Chai**, and **ExcelJS**.

---

## Architecture

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Language       | JavaScript ES6+                         |
| Runtime        | Node.js 20+                             |
| Automation     | Appium 2.x + UiAutomator2 driver        |
| Test Runner    | Mocha 10 + Chai                         |
| Design Pattern | Page Object Model (POM)                 |
| HTML Report    | Mochawesome                             |
| Excel Report   | ExcelJS (4 sheets, styled)              |
| Logging        | Winston                                 |
| CI/CD          | GitHub Actions (matrix: API 30 + 33)   |

---

## Project Structure

```
e2e/
├── config/
│   ├── capabilities.js      — Appium capability builder (APK / installed)
│   └── testConfig.js        — Timeouts, paths, Appium server config
├── drivers/
│   └── driverFactory.js     — Session creation, device detection, parallel support
├── pages/                   — Page Object classes (one per screen)
│   ├── basePage.js          — Base class: waits, interactions, scroll, keyboard
│   ├── loginPage.js
│   ├── signupPage.js
│   ├── onboardingPage.js
│   ├── feedPage.js
│   ├── explorePage.js
│   ├── journalPage.js
│   ├── profilePage.js
│   ├── trackerPage.js
│   ├── messagesPage.js
│   ├── notificationsPage.js
│   ├── searchPage.js
│   ├── resourcesPage.js
│   ├── safetyPage.js
│   └── toolboxPage.js
├── tests/
│   ├── base/baseTest.js     — Global before/after hooks + Excel/screenshot wiring
│   ├── auth/                — loginTest, signupTest, logoutTest
│   ├── feed/                — feedTest
│   ├── explore/             — exploreTest
│   ├── forms/               — formValidationTest
│   ├── navigation/          — navigationTest
│   ├── tracker/             — trackerTest
│   ├── messages/            — messagesTest
│   ├── profile/             — profileTest
│   ├── performance/         — performanceTest (SLA assertions)
│   └── safety/              — safetyTest
├── utilities/
│   ├── appiumUtils.js       — App lifecycle, alerts, keyboard, device info
│   ├── gestureUtils.js      — Tap, double-tap, long-press, swipe, pinch, zoom, drag
│   ├── excelReporter.js     — 4-sheet Excel report with brand styling
│   ├── screenshotUtils.js   — Screenshot + failure capture
│   ├── deviceLogUtils.js    — Logcat capture + crash detection
│   ├── performanceUtils.js  — SLA timers, load time measurement
│   └── dataProvider.js      — JSON test data loader
├── testdata/
│   ├── users.json           — Valid / invalid / new-user credentials
│   ├── posts.json           — Mock post data
│   └── journalEntries.json  — Mock journal entries
├── reports/failures/        — Screenshots of failed tests
├── screenshots/             — All screenshots
├── logs/                    — Winston logs + logcat files
├── excel/                   — Generated Excel reports
├── .env                     — Local environment config (not committed)
├── .env.example             — Environment template
├── .mocharc.json            — Mocha config (file, reporter, timeout, retries)
└── .github/workflows/
    └── appium-e2e.yml       — CI matrix: Android API 30 + 33
```

---

## Quick Start

### 1. Prerequisites

```bash
# Node.js 20+
node --version

# Java 17+
java --version

# Android SDK + ADB
adb --version

# Appium 2.x
npm install -g appium
appium driver install uiautomator2
appium driver list
```

### 2. Install framework

```bash
cd e2e
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Use installed app (Expo Go)
EXECUTION_MODE=installed
APP_PACKAGE=host.exp.exponent
APP_ACTIVITY=host.exp.exponent.LauncherActivity

# Or test an APK directly
# EXECUTION_MODE=apk
# APK_PATH=../apps/mobile/android/app/build/outputs/apk/release/app-release.apk

# Leave empty for auto-detection, or specify:
# DEVICE_UDID=emulator-5554
# ANDROID_VERSION=13
```

Update test credentials in `testdata/users.json`.

### 4. Start Appium

```bash
appium
```

### 5. Connect device / start emulator

```bash
# List connected devices
adb devices

# Or start emulator
emulator -avd Pixel_5_API_33
```

### 6. Run tests

```bash
# All test suites
npm test

# Specific modules
npm run test:auth
npm run test:feed
npm run test:explore
npm run test:forms
npm run test:navigation
npm run test:tracker
npm run test:messages
npm run test:profile
npm run test:performance
npm run test:safety

# CI mode (with mochawesome reporter)
npm run test:ci
```

---

## Reports

After execution, reports are in:

| Type              | Location                          |
|-------------------|-----------------------------------|
| HTML Report       | `mochawesome-report/index.html`   |
| Excel (4 sheets)  | `excel/Mobile_E2E_Report_*.xlsx`  |
| Failure Screenshots | `reports/failures/`             |
| All Screenshots   | `screenshots/`                    |
| Logs + Logcat     | `logs/`                           |

### Excel Report — 4 Sheets

| Sheet           | Contents                                                    |
|-----------------|-------------------------------------------------------------|
| Summary         | Date, Device, Android version, Pass %, Duration            |
| Test Cases      | All tests with status, timestamps, module (colour-coded)   |
| Failed Tests    | Failure reason, screenshot path, activity, device          |
| Execution Logs  | Step-level log with timestamps and stack traces            |

---

## Adding testID props to the app

Each page object documents the `testID` props required in React Native. Add them to components:

```tsx
// Example — Login screen
<TextInput testID="login-email-input" ... />
<TextInput testID="login-password-input" ... />
<Pressable testID="login-submit-btn" ... />
<Text testID="login-error-banner" ... />
```

---

## CI/CD — GitHub Actions

The workflow at `.github/workflows/appium-e2e.yml`:

- Triggers on push to `main`/`develop`, PR to `main`, and manually via `workflow_dispatch`
- Runs a **matrix** across Android API **30** and **33**
- Uses `reactivecircus/android-emulator-runner@v2` with KVM acceleration
- Uploads: HTML report, Excel report, screenshots, device logs as artifacts (30-day retention)
- Posts a summary to the GitHub Step Summary

---

## Gesture Reference

All gestures are in `utilities/gestureUtils.js`:

| Method              | Description                              |
|---------------------|------------------------------------------|
| `tap(x, y)`         | Single tap at coordinates                |
| `doubleTap(x, y)`   | Double tap                               |
| `longPress(x, y)`   | Long press (default 1500ms)              |
| `swipe(x1,y1,x2,y2)`| Directional swipe                       |
| `scrollDown()`      | Scroll down 55% of screen height         |
| `scrollUp()`        | Scroll up 55% of screen height           |
| `swipeLeft()`       | Horizontal swipe left                    |
| `swipeRight()`      | Horizontal swipe right                   |
| `scrollUntilVisible(selector)` | Scroll until element found  |
| `dragAndDrop()`     | Drag from point A to point B             |
| `pinch(x, y)`       | Two-finger pinch (zoom out)              |
| `zoom(x, y)`        | Two-finger zoom (zoom in)                |

---

## Performance SLAs

| Metric           | SLA     |
|------------------|---------|
| App Launch       | < 8s    |
| Login Action     | < 5s    |
| Feed Load        | < 6s    |
| Tab Switch       | < 3s    |
| Journal Save     | < 10s   |
