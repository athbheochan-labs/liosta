# Liosta

![Liosta banner](./static/readme-banner.png)

Liosta is a small offline-first list app in Irish. It supports multiple lists, item counts, checked items, local persistence, PWA install, and Android packaging through Capacitor.

## Cad e Liosta?

Liosta is for quick everyday lists: shopping, tasks, notes, or anything that benefits from a simple checked/unchecked flow. Data is stored locally in the browser with `localStorage`, so the app keeps working offline after the shell has been cached.

## Suiteail

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Run type and Svelte checks:

```sh
npm run check
```

## Togail

Build the web app:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

Build and sync the Android project:

```sh
npm run build
npx cap sync android
```

Open Android Studio:

```sh
npx cap open android
```

Build an Android debug APK from the command line:

```sh
./android/gradlew -p android :app:assembleDebug
```

## Ceadunas

MIT. See [LICENSE](./LICENSE).
