# PG ERP — Mobile app

React Native (Expo SDK 58, TypeScript) app for Indian PG owners and residents.
UI source of truth: the approved wireframe in `../prototype/`. API source of truth: `../docs/openapi-v0.1.0.json` (analysis in `../docs/API_ANALYSIS.md`).

## Run it

```bash
npm install
cp .env.example .env          # API base URL (public value only — no secrets)
npm run android               # builds a dev client and opens it on an emulator / USB phone
npx expo start                # Metro only (after a dev client is installed)
```

iOS needs a Mac or an EAS cloud build (`npx eas-cli@latest build --profile development --platform ios`).

## Checks

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript strict mode |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm test` | Jest + React Native Testing Library |
| `npm run verify` | all of the above |

## Architecture

```
src/
  api/          client.ts (axios + envelope + 401 refresh), errors.ts, endpoints.ts,
                types/ (envelope, request models from OpenAPI), services/ (auth, generic CRUD, resources)
  auth/         session.ts (Zustand session store), tokenStorage.ts (SecureStore), authContract.ts (response parsing)
  components/   common/ (Button, TextField, Select, DateField, Card, Badge, ListItem, ChipGroup, SegmentedControl,
                BottomSheet, ConfirmDialog, AppHeader, Screen, SearchBar), feedback/ (state views, QueryBoundary,
                OfflineBanner), property/ (PropertySwitcher)
  constants/    modules.ts — module list + backend readiness
  i18n/         English (complete), Hindi + Gujarati (partial, fall back to English)
  navigation/   RootNavigator → Auth | Owner | Resident trees (only one mounted at a time)
  providers/    AppProviders (fonts, query client, toasts), queryClient.ts
  screens/      auth/, owner/, resident/, shared/
  store/        propertyContext.ts — selected property / All Properties
  theme/        colours, type scale, spacing, radius from the wireframe
  utils/        ₹ formatting, dates, +91 mobile, validation rules
```

### Auth flow
1. App start → `session.restore()` reads the refresh token from SecureStore and calls `POST /auth/refresh`.
2. Login → `POST /auth/login` with `{ email, password }`; tokens are read in `authContract.ts`.
3. Every request gets `Authorization: Bearer <access token>` (memory only).
4. A 401 triggers **one** shared refresh, then the request is retried. If refresh fails, the session ends and the login screen says why.
5. Logout → `POST /auth/logout` (best effort) → SecureStore, query cache and property scope are cleared.

### Still to confirm with the backend
- Login/refresh response field names and where the role is returned — see `src/auth/authContract.ts`. Run `scripts/inspect-login.ps1` with a test account to print the response shape with tokens masked.
- Real backend role names → `ROLE_NAME_MAP` in the same file.
