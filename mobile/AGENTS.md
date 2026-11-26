This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npm run lint                # ESLint (`npx expo lint` fails its own ESLint version check on SDK 58; use this)
npm run typecheck           # tsc --noEmit
npm test                    # Jest (jest-expo)
npm run verify              # all three
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run `npm run verify` before declaring any task done.

## Navigation & Routing (project decision)

- This project uses **React Navigation** (native stack + bottom tabs), NOT Expo Router — chosen so Owner, Resident and Auth are separate navigation trees that are never mounted together (see `src/navigation/RootNavigator.tsx`).
- Add Owner detail/form screens to `OwnerStackParamList` in `src/navigation/types.ts` and register them in `OwnerNavigator.tsx`; same pattern for Resident.

## PG ERP API rules

- The backend contract is `../docs/openapi-v0.1.0.json`, analysed in `../docs/API_ANALYSIS.md`. Never add an endpoint, request field or response field that isn't documented or confirmed from a real response.
- All HTTP goes through `src/api/client.ts` (`apiRequest`). Services live in `src/api/services/`, request types in `src/api/types/models.ts`.
- Response `data` shapes are undocumented (`any`); keep them `unknown` until confirmed. Token/role parsing lives only in `src/auth/authContract.ts`.
- Never log tokens, passwords or KYC data. Tokens are stored only via `src/auth/tokenStorage.ts` (expo-secure-store).
- Update `src/constants/modules.ts` (`apiStatus`) when the backend adds endpoints for a module.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
