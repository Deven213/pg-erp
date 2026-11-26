# Phase 4 — Authentication integration status

Updated: 24 Nov 2026 · API: OpenAPI v0.1.0 (live spec re-checked today — unchanged)

## Status

| Item | UI | API wired | Verified against real API | Tests |
|---|---|---|---|---|
| Login (`POST /auth/login`, email + password) | ✅ | ✅ | ⏳ success response not yet seen | ✅ validation, request shape, rejection |
| Read tokens from login response | — | ✅ | ⏳ **needs `inspect-login.ps1` output** | ✅ (assumed `data.access_token`) |
| Owner / Resident role detection | ✅ | ✅ | ⏳ **needs `inspect-login.ps1` output** | ✅ unknown role → blocked screen |
| Secure token storage (Keychain / Keystore) | — | ✅ | n/a (device) | ✅ via session tests |
| Session restore on app start (`POST /auth/refresh`) | ✅ | ✅ | ✅ rejection path (real 401 / 422) · ⏳ success path | ✅ |
| Token refresh on 401 (single shared refresh) | — | ✅ | ✅ 401 body verified | ✅ |
| Early refresh before JWT `exp` | — | ✅ | ⏳ needs a real token to confirm `exp` exists | ✅ |
| Logout (`POST /auth/logout`) | ✅ | ✅ | ✅ "already revoked" 401 verified | ✅ |
| Invalid credentials message | ✅ | ✅ | ⏳ real wrong-password response not captured | ✅ |
| Expired session → login with explanation | ✅ | ✅ | ✅ | ✅ |
| Offline / server asleep on start | ✅ Retry screen | ✅ | ✅ (timeouts) | ✅ |
| Unsupported role (e.g. Super Admin) | ✅ | ✅ | ⏳ role names unknown | ✅ |
| Separate Owner / Resident navigation | ✅ | — | — | — |

## Real responses captured (no credentials used)

| Call | Status | Body |
|---|---|---|
| `POST /auth/refresh` with an invalid token | 401 | `message: "Token refresh failed."`, `errorMessage: "Refresh token is invalid, expired, or revoked."`, `data: null` |
| `POST /auth/logout` with an invalid token | 401 | `message: "Logout failed."`, `errorMessage: "Refresh token is invalid or already revoked."`, `data: null` |
| `POST /auth/refresh` with a too-short token | 422 | `message: "Request validation failed."`, `data: null` |
| Any protected endpoint without a token | 401 | `message: "Authentication required."` |

Stored in `mobile/src/test-utils/apiResponses.ts` and used by the tests.

## Changes in this phase

- **Storage failures can't trap the user**: unreadable secure storage on start → login screen (was: stuck on splash); logout always signs out locally.
- **Clean account switch**: a new login clears the previous account's stored tokens and role first.
- **Honest messages**: "session expired" is shown only when the server rejected the refresh token (401/422), not for other failures.
- **Early refresh**: if the access token's standard JWT `exp` claim is within 30 s, the client renews it before sending the request.
- Tests: `src/auth/__tests__/session.test.ts` (10 tests), 3 new client tests, shared real responses in `src/test-utils/`.

## API limitations (unchanged backend)

1. Login/refresh **success** responses are undocumented (`data: any`).
2. No `/me` endpoint — role must come from the login response or token claims.
3. No mobile/OTP login, registration, forgot-password or resident invite endpoints (wireframe screens A-02…A-05, A-07…A-14 stay unbuilt).
4. Token lifetimes aren't documented.

## Test Owner account (25 Nov 2026)

- Login for `demo@gmail.com` returns 401 "Email or password is incorrect, or the account is inactive." The server deliberately doesn't say which.
- The backend source isn't in this workspace, and every user/role endpoint needs a Bearer token, so the mobile side can't see whether the account exists, is inactive, or has the wrong role.
- An Owner is created through the API by someone already logged in with admin rights:
  1. `POST /api/v1/tenants` creates the PG business (`business_name`, `owner_name`, `email`).
  2. `POST /api/v1/users` creates the user (`tenant_id`, `full_name`, `email`, `mobile_number`, `password` of 8+ characters, `is_active: true`).
  3. `GET /api/v1/roles` finds the Owner role's id.
  4. `POST /api/v1/user-roles` links the user, the role and the tenant (`user_id`, `role_id`, `tenant_id`).
- There's no self-registration endpoint, so the first admin account has to come from the backend itself (a seed script or a database insert).

## Needs your action

1. **Run** `powershell -ExecutionPolicy Bypass -File E:\pg\mobile\scripts\inspect-login.ps1` with the test **owner** account and paste the output (tokens are masked). If you have a **resident** test account, run it again with that one.
2. Tell me the exact role names the backend uses for owners and residents (or the output above will show them).
3. **Free space on drive C:** — it is at 0 MB; `npm` commands fail until it has space (Node-direct commands were used for this report).
4. Change the test account password once testing is finished (it was shared in chat).
