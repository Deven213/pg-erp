# Phase 5 — Property Management: implementation report

Date: 26 Nov 2026 · API: OpenAPI v0.1.0 · Building Management: **not started** (by design)

## 1. Summary

| Area | UI built | Works against the real API? | Automated tests |
|---|---|---|---|
| Property list | ✅ | ⏳ not verified — no Owner login yet | ✅ |
| Property details | ✅ | ⏳ not verified | ✅ |
| Add property | ✅ | ⏳ not verified (also needs the business id — see B2) | ✅ |
| Edit property | ✅ | ⏳ not verified | ✅ |
| Delete with confirmation | ✅ | ⏳ not verified | ✅ |
| Property switcher (bottom sheet) | ✅ | ⏳ uses the list above | ✅ |
| All Properties selection | ✅ | n/a (app-side) | ✅ |
| Property context across the Owner app | ✅ app-side | n/a — but every future module needs B6 | ✅ |
| Loading / empty / error / success states | ✅ | — | ✅ |
| Development-only preview data | ✅ | n/a (never calls the server) | ✅ |

**Nothing in this phase has been checked against the live backend.** Every request follows the OpenAPI spec exactly. How the server responds is still unknown until an Owner login works (Phase 4).

Checks run: `tsc --noEmit` passes, `eslint .` passes (0 problems), and Jest passes: **103 tests in 13 suites**, up from 55. `npm` itself can't run while drive C: is full, so these were run directly with Node.

## 2. Endpoints used (all documented, nothing invented)

| Screen action | Request |
|---|---|
| List, switcher | `GET /api/v1/properties` |
| Details, edit prefill | `GET /api/v1/properties?id={id}` |
| Add | `POST /api/v1/properties` (no `id`) |
| Edit | `POST /api/v1/properties` (with `id`) |
| Delete | `DELETE /api/v1/properties/{id}` |

The request body uses only `PropertyUpsert` fields:

- **The form sends** `property_name`, `property_code`, `property_type`, `address`, `city`, `state`, `pincode` and `description`, plus `tenant_id`.
- **The form leaves out:**
  - `status`: the spec lists no values beyond the default `"active"`. On create the server default applies; on edit the stored value is sent back unchanged.
  - `image_url`: there's no upload endpoint. It's kept unchanged on edit.
- **On edit the whole record is sent**, because the spec doesn't say whether a POST with an `id` does a full or partial update.

## 3. What was built

**Screens** (`mobile/src/screens/owner/properties/`)

- **PropertyListScreen** is the Properties tab.
  - Each row shows the name, "City · Type", the code and a status badge, plus a "Current" badge on the selected property.
  - It supports pull-to-refresh, a header Add button and search once there are 6 or more properties.
  - It has loading, empty (with an Add action) and error (with Try again) states.
- **PropertyDetailsScreen** shows the full address, status and type, and a table of details (code, type, city, state, PIN code) plus the description.
  - It has a "View the app for this property" button that sets the shared context.
  - A Buildings/rooms/beds row is marked "Coming soon" because Building Management isn't started.
  - Delete is behind a confirmation dialog. On success the app shows a toast, goes back and clears the property from the context if it was selected. On failure the property stays and the server's message is shown.
- **PropertyFormScreen** handles both Add and Edit.
  - It validates every field with zod, using the spec's limits plus an Indian 6-digit PIN code.
  - Property type is free text with quick-fill chips (Boys PG / Girls PG / Co-living, from the wireframe).
  - It shows a 422 or server message in a banner and blocks double submits.
  - It asks before discarding typed changes.
  - Edit loads the server's copy before showing the form, so it never edits stale list data.

**Property context**

- `store/propertyContext.ts` holds the current choice ('all' or a property id).
  - It's saved on the device so it survives restarts (wireframe D-02), and cleared on sign-out.
  - It's not saved during the UI preview.
- `features/properties/usePropertyScope.ts` checks the saved choice against the real list. A property that no longer exists falls back to All Properties.
- `components/property/PropertySwitcher.tsx` is the chip and bottom sheet.
  - It's hidden for owners with fewer than 2 properties.
  - It adds search from 6 properties.
  - It has an "Add property" button in the sheet.
- The Home, Residents and Finance tabs (still placeholders) show the switcher in their header and a "Showing: …" line, so those modules will use the same context when they're built.

**Data layer** (`mobile/src/features/properties/`)

- `propertyContract.ts` is the **only** place that reads property records from responses. It's marked UNVERIFIED and throws a "contract" error rather than showing guessed or partial data.
- `propertyApi.ts` and `queries.ts` hold the service calls and the TanStack Query hooks. Preview and real data have separate cache keys.
- `propertyForm.ts` holds the form schema and the form-to-`PropertyUpsert` mapping.

**Auth (small, guarded addition)**

- `authContract.resolveTenantId()` looks for a UUID `tenant_id` in the login/refresh response or the token's claims. It returns null if there isn't one; it never guesses. The session keeps it in memory only.
- If it's null, Add property uses the single `tenant_id` shared by the owner's existing properties. Otherwise the form is blocked with an explanation.

## 4. Development-only preview

Open the app in Expo Go. On the login screen, choose **Preview Owner app** (this appears only when `__DEV__` is true and `EXPO_PUBLIC_ENABLE_UI_PREVIEW=true`).

- The Properties tab then reads an **in-memory, on-device store** instead of the server. It starts empty, and nothing is sent to the backend.
- An amber "Development only · preview data" panel offers three actions:
  - **Add 3 samples** adds records clearly named "Sample Property N (preview)".
  - **Fail next request** makes the next request fail, so you can test the error state.
  - **Clear** empties the store.
- Preview data, choices and cache are dropped when the preview starts or ends.
- None of this is compiled into release builds, because `__DEV__` is false there.

## 5. Tests added

| File | Covers |
|---|---|
| `features/properties/__tests__/propertyContract.test.ts` | Record mapping, contract errors, not-found |
| `features/properties/__tests__/propertyApi.test.ts` | Exact method/URL/body for list, get, create, update, delete; preview never calls the server; simulated failure |
| `features/properties/__tests__/propertyForm.test.ts` | Required fields, spec length limits, PIN code, create vs edit body |
| `store/__tests__/propertyContext.test.ts` | Save/restore across restarts, storage failure, no persistence in preview |
| `components/property/__tests__/PropertySwitcher.test.tsx` | Hidden under 2, switching, All Properties, search from 6, Add |
| `screens/owner/properties/__tests__/PropertyScreens.test.tsx` | Real navigation stack. List loading/empty/error-retry/contract error/search; navigation to details; set as current; delete confirm, cancel and failure; not found; add validation, create, 422 message, missing business id; discard dialog; edit prefill and full-record update; switcher on other tabs; stale-choice fallback |
| `auth/__tests__/authContract.test.ts` | `resolveTenantId` found / not found |

The screen tests replace only the HTTP call with an in-memory backend that follows the documented endpoints. Its records use `PropertyUpsert` field names; they are **not** real server responses.

## 6. Backend dependencies still requiring verification

| # | Dependency | Why it matters | Where to change once known |
|---|---|---|---|
| B1 | **Shape of `GET /properties` `data`**: is it an array, and are the field names the same as `PropertyUpsert`? | The list and details can't show real data until confirmed. A different shape shows "couldn't read the server's response". | `propertyContract.ts` only |
| B2 | **Where the owner's `tenant_id` comes from** (login response, token claim, or `/users`) | Required to create a property. Without it, Add is blocked for an owner with no properties. | `authContract.resolveTenantId()` |
| B3 | **Tenant isolation:** does `GET /properties` return only the logged-in owner's properties? | Otherwise an owner could see another business's properties. This must be enforced by the server. | Backend |
| B4 | **Delete behaviour:** what happens to buildings, floors, rooms and beds under a deleted property? Is a property with residents blocked? | The dialog currently warns that linked data "may also be affected". | Dialog text + backend |
| B5 | **Update semantics** of `POST` with `id`: full replace or partial? | The app sends the full record to be safe. | `propertyForm.ts` |
| B6 | **No property filter** on other endpoints (`?property_id=`) | Each future module has to load everything and filter on the phone to follow the selected property. | Backend (recommended) |
| B7 | **Allowed `status` values** beyond `"active"` | The app can't offer activate/deactivate yet. | Form + badge |
| B8 | **Allowed `property_type` values** (is it Boys/Girls/Co-living?) | It's free text with suggestions for now. | `PROPERTY_TYPE_SUGGESTIONS` |
| B9 | **Is `property_code` unique**, and what error comes back if it isn't? | The 422 message doesn't say which field failed. | Form error mapping |
| B10 | **`GET ?id=` for a missing or other-tenant id:** an empty list, 404 or 403? | The app handles all three, but the real behaviour is unconfirmed. | `parseProperty` |
| B11 | **Fields in the wireframe with no API:** contact number, map location, amenities, photos (upload), documents, rules/curfew | These aren't built. | New endpoints needed |

## 7. Not done / known limits

- Not checked on a phone or simulator yet (Expo Go: Properties tab in Owner preview). The browser pane can't run this app because it has no web support.
- Hindi and Gujarati text for the new screens isn't written yet; the app falls back to English.
- Building Management (buildings → floors → rooms → beds) is not started, as instructed.

## 8. Next steps

1. Get the Owner login working (Phase 4), then run `inspect-login.ps1` → confirms **B2**.
2. With a token, capture one real `GET /api/v1/properties` response → confirms **B1** and updates `propertyContract.ts`.
3. Send **B3–B10** to the backend team.
4. Test on a device in the Owner preview, then with the real login.
5. Once Property Management is accepted, start Building Management.
