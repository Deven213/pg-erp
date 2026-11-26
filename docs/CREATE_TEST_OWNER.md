# Creating a test Owner account (for the backend administrator)

Script: `mobile/scripts/create-test-owner.ps1` · Based on: OpenAPI v0.1.0 (`docs/openapi-v0.1.0.json`)

The mobile app needs one working **Owner** login on a **non-production** server to finish authentication testing. This page explains how a backend administrator creates one using only the documented API.

## What the script does

| Step | Endpoint (documented) | Fields sent (all from the spec's `*Upsert` schemas) |
|---|---|---|
| 0 | `GET /openapi.json` | — checks the server has all the endpoints below |
| 1 | `GET /api/v1/roles` | — checks the admin token, lists roles; **you choose** the Owner role by its exact name |
| 2 | `POST /api/v1/tenants` | `business_name`, `owner_name`, `email`, `status: "active"` |
| 3 | `POST /api/v1/users` | `tenant_id`, `full_name`, `email`, `mobile_number`, `password`, `is_active: true` (+ `is_verified: true` only with `-SetVerified`) |
| 4 | `POST /api/v1/user-roles` | `user_id`, `role_id`, `tenant_id` |
| 5 | `GET /users?id=`, `GET /tenants?id=`, `GET /user-roles` | — confirms: user exists, belongs to the tenant, is active; tenant exists; Owner role is linked for that tenant |
| 6 | `POST /api/v1/auth/login` | logs in as the new Owner and reports success or failure. It prints the **names** of the response fields only, never their values |

**Safety built in**

- There's no default server, and before anything is sent you must type the host name to confirm it is non-production.
- It does a **dry run by default**: read-only GETs, then it shows the exact POST bodies (with the password hidden). Nothing is created without `-Execute`.
- The admin token and the new password are read through hidden prompts. They're never printed, logged or saved, and they're cleared from memory at the end. The password is asked for twice.
- It never creates roles, never sends an `id` (so it can't overwrite existing records), and never deletes anything.
- It stops if the business email or user email already exists, or if the role name doesn't match exactly once.
- It prints only server messages, never full response bodies, which could contain user data or password hashes.

## Before you start: needs administrator confirmation

| # | Question | Why it matters |
|---|---|---|
| 1 | **Which server is non-production?** Is `pg-erp.onrender.com` production? If so, what is the staging/dev URL? | The script must not run against production. |
| 2 | **What is the exact name of the Owner role** in `GET /roles`? Does it exist on that server? | The script won't guess or create roles. If it's missing, the backend team must add it first. |
| 3 | **Which account can create tenants, users and user-roles?** (e.g. a Super Admin) | You need a valid access token for that account. |
| 4 | **Must `is_verified` be true to log in?** | If yes, run with `-SetVerified`. The spec defaults it to `false`. |
| 5 | Does `POST /users` hash the password it receives? | It should; the script sends it over HTTPS just like login does. |
| 6 | Are user emails unique across all businesses? May the business email equal the Owner's login email? | Affects which emails to use. |
| 7 | Any required format for `mobile_number`? (e.g. `+91…` or 10 digits) | The spec only says 1–20 characters. |
| 8 | Is the role in `user-roles` really per business (`tenant_id`)? | It decides which business the Owner sees after login. |

The **response shapes** of these endpoints aren't documented (`data` is untyped). The script finds new records by matching the email it just sent. If it can't, it stops and tells you to look the id up and rerun with `-TenantId` / `-UserId`.

## Steps

1. **Get an admin access token** on the non-production server:
   - Open `https://<non-production-host>/docs`.
   - Use `POST /api/v1/auth/login` → *Try it out* with the admin account.
   - Copy the access token value from the response.
   - Don't paste it into chat, tickets or files.
2. **Dry run** (creates nothing):
   ```powershell
   powershell -ExecutionPolicy Bypass -File E:\pg\mobile\scripts\create-test-owner.ps1 -BaseUrl https://<non-production-host>
   ```
   Type the host name to confirm, paste the token at the hidden prompt and type the Owner role name. Then enter test details: a business name like `TEST PG - Dev`, a test email address you control (not a real customer's) and a test mobile number. Check the POST bodies it shows.
3. **Create:** run the same command with `-Execute`, plus `-SetVerified` if question 4 is "yes". Enter a new password used nowhere else.
4. **Check the summary:** every line under *Verifying…* should be `True` (or `active`), and the result should say `LOGIN OK`.
5. **Send the Owner's email to the mobile developer.** Share the password privately, e.g. in person or through a password manager, never in chat or tickets.

**If a step fails:**

- **Rerun after a partial failure:**
  ```powershell
  ... -Execute -TenantId <id> [-UserId <id>] [-RoleId <id>]
  ```
  It reuses those records and only adds what's missing. The role link is skipped if it already exists. When `-UserId` is used, the password isn't changed and the login test is skipped.
- **`HTTP 401`:** the token is invalid or expired. Get a new one.
- **`HTTP 403`:** that account isn't allowed to do this.
- **`HTTP 422`:** check the values you entered (and question 7).
- **`LOGIN FAILED` with 401** even though every check is `True`: confirm question 4 (`is_verified`) and question 5 (password hashing).

## Verifying the Owner can log in (mobile developer)

After the admin finishes, run:

```powershell
powershell -ExecutionPolicy Bypass -File E:\pg\mobile\scripts\inspect-login.ps1 -BaseUrl https://<non-production-host>
```

Enter the Owner's email and password, then paste the output into the development chat (tokens are masked). That output confirms the real login response shape and role names, which the app's auth contract still needs.

## Clean-up

The test records can be removed with the documented `DELETE /api/v1/user-roles/{id}`, `DELETE /api/v1/users/{id}` and `DELETE /api/v1/tenants/{id}`, in that order, using the IDs the script printed. The script never deletes anything itself.

## How the script was tested

It was run only against a **local mock server** on `127.0.0.1`. That mock used guessed response shapes, and the script never touched the real backend. The tests covered:

- a dry run;
- a full create, including the login check;
- a server that returns no data from POST, so the script has to fall back to GET;
- a host-name mismatch;
- a bad token;
- duplicate emails;
- a wrong role-name case;
- rerunning with `-TenantId`/`-UserId`/`-RoleId`.

The output never contained the password, the token or a password hash. Its behaviour against the real server still depends on the confirmations above.
