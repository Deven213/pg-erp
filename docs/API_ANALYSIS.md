# PG ERP — API Analysis (Phase 2)

Source: https://pg-erp.onrender.com/docs · OpenAPI 3.1, **PG ERP API v0.1.0** · snapshot saved as `docs/openapi-v0.1.0.json`
Reviewed: 24 Nov 2026

---

## 1. Summary

The backend currently covers **authentication, access control (tenants/users/roles/permissions) and the property hierarchy (property → building → floor → room → bed + room amenities)**. Every other module in the wireframes (residents, KYC, reservations, rent, payments, deposits, expenses, complaints, notices, reports, subscription, etc.) has **no endpoints yet**.

| | Count |
|---|---|
| Endpoints | 40 (39 under `/api/v1`, plus `/health`) |
| Modules covered fully enough to build | 1 (Buildings, floors, rooms, beds) |
| Modules covered partly | 3 (Authentication, Properties, Staff via users/roles) |
| Modules with no API | 21 of 25 (owner + resident) |

---

## 2. Conventions observed (verified against the live server)

**Response envelope** — every response, success or error:
```json
{ "success": true, "message": "Service is healthy.", "errorMessage": null, "data": null }
```
- `data` is typed as `any` in the spec, so **no response shapes are documented**. List and record structures must be confirmed with real responses.

**Errors** (tested live):
| Case | Status | `message` | `errorMessage` |
|---|---|---|---|
| No token | 401 | Authentication required. | A valid Bearer access token is required. |
| Invalid/expired token | 401 | Authentication failed. | The access token is invalid or expired. |
| Bad request body | 422 | Request validation failed. | Please check the request data and try again. |

- The 422 envelope returns `data: null`, so **the app can't show which field failed**. Client-side validation must mirror the server rules (lengths, regex below).
- `message`/`errorMessage` are user-readable → the app can show `errorMessage` directly, with a fallback.

**Auth**: `Authorization: Bearer <JWT>`; access token + refresh token (`/auth/refresh`, refresh token 20–256 chars). Token lifetimes not documented.

**CRUD pattern** (all resources):
| Operation | Call |
|---|---|
| List | `GET /api/v1/{resource}` |
| Get one | `GET /api/v1/{resource}?id={uuid}` |
| Create | `POST /api/v1/{resource}` with no `id` |
| Update | `POST /api/v1/{resource}` with `id` |
| Delete | `DELETE /api/v1/{resource}/{id}` |

- **No filtering by parent** (e.g. buildings of one property), **no pagination, no search, no sorting** parameters.
- IDs are UUIDs.

---

## 3. Endpoint inventory

| Module | Endpoints | Request model (`*` = required) |
|---|---|---|
| Health | `GET /health` | — |
| Auth | `POST /auth/login` | `email*` (≤255), `password*` (≤128) |
| | `POST /auth/refresh` | `refresh_token*` (20–256) |
| | `POST /auth/logout` | `refresh_token*` |
| Tenants (= PG businesses) | `GET/POST /tenants`, `DELETE /tenants/{id}` | `business_name*`, `owner_name*`, `email*`, `phone`, `address`, `city`, `state`, `status`="active" |
| Users | `GET/POST /users`, `DELETE /users/{id}` | `tenant_id*`, `full_name*`, `email*`, `mobile_number*` (≤20), `password` (8–128), `profile_image`, `is_active`=true, `is_verified`=false |
| Roles | `GET/POST /roles`, `DELETE /roles/{id}` | `name*` (≤50), `description` |
| Permissions | `GET/POST /permissions`, `DELETE /permissions/{id}` | `permission_key*`, `module*`, `description` |
| User roles | `GET/POST /user-roles`, `DELETE /user-roles/{id}` | `user_id*`, `role_id*`, `tenant_id*` |
| Role permissions | `GET/POST /role-permissions`, `DELETE /role-permissions/{id}` | `role_id*`, `permission_id*` |
| Properties | `GET/POST /properties`, `DELETE /properties/{id}` | `tenant_id*`, `property_name*`, `property_code*`, `address*`, `city*`, `state*`, `pincode*` (≤10), `property_type*`, `description`, `image_url`, `status`="active" |
| Buildings | `GET/POST /buildings`, `DELETE /buildings/{id}` | `property_id*`, `building_name*`, `building_code*`, `total_floors*`, `description`, `status`="active" |
| Floors | `GET/POST /floors`, `DELETE /floors/{id}` | `building_id*`, `floor_number*`, `floor_name*`, `total_rooms*` |
| Rooms | `GET/POST /rooms`, `DELETE /rooms/{id}` | `floor_id*`, `room_number*`, `room_type*`, `capacity*`, `monthly_rent*`, `description`, `status`="active" |
| Beds | `GET/POST /beds`, `DELETE /beds/{id}` | `room_id*`, `bed_number*`, `bed_type*`, `monthly_rent*`, `status` ∈ available/occupied/reserved/maintenance/inactive |
| Room amenities | `GET/POST /room-amenities`, `DELETE /room-amenities/{id}` | `room_id*`, `amenity_name*`, `description` |

> Naming note: in this API **"tenant" means the PG business** (multi-tenant SaaS), not a PG resident. The app code will call it `business` in the UI and keep `tenant` only in API types, to avoid confusion.

---

## 4. Screen-to-API mapping

Legend: ✅ buildable · 🟡 partly (missing fields or behaviour) · ❌ no API

### Authentication
| Wireframe screen | API | Status | Gap |
|---|---|---|---|
| Mobile number + OTP login (A-04/05) | — | ❌ | Backend uses **email + password**, no OTP endpoints |
| Password login (A-06) | `/auth/login` | 🟡 | Uses email, not mobile; response shape unknown |
| Forgot / reset password (A-07) | — | ❌ | |
| Owner registration (A-08…A-12) | `/tenants` + `/users` + `/user-roles` | 🟡 | All need a Bearer token → a new owner can't self-register |
| Resident invite activation (A-13) | — | ❌ | |
| Account selection (A-14) | — | ❌ | No "my accounts/roles" endpoint |
| Logout, session refresh | `/auth/logout`, `/auth/refresh` | ✅ | |
| Role-based routing | — | 🟡 | **No `/me` endpoint**; depends on what login returns |

### Owner app
| Module | Status | Notes |
|---|---|---|
| M1 Dashboard | ❌ | No occupancy, rent or summary endpoints. Occupancy could be computed from `/beds`, but rent/expense figures need APIs |
| M2 Properties | 🟡 | CRUD works. Missing vs wireframe: gender type (Boys/Girls/Co-living — is this `property_type`?), contact number, email, map location, property amenities, multiple photos, documents & expiry, rules/curfew. No image upload endpoint (`image_url` is a string) |
| M3 Buildings, floors, rooms, beds | ✅/🟡 | Full CRUD. Gaps: can't list children by parent; AC/Non-AC and bathroom type not fields (could be `room_type`/amenities); no bed allocation history; no electricity meter readings |
| M4 Residents & KYC | ❌ | Nothing for residents, guardians, KYC documents, police verification, check-in/out |
| M5 Reservations | ❌ | |
| M6 Rent, invoices, payments | ❌ | |
| M7 Deposits | ❌ | |
| M8 Expenses | ❌ | |
| M9 Complaints | ❌ | |
| M10 Staff | 🟡 | Could use `/users` + `/user-roles` for staff logins. Missing: attendance, shifts, leave, salary, property assignment |
| M11 Reports | ❌ | |
| M12 Notifications & announcements | ❌ | |
| M13 Subscription | ❌ | |
| M14 Settings | 🟡 | Business profile → `/tenants`, owner profile → `/users`. No change-password, notification prefs, payment settings |
| Add-ons (visitors, mess, electricity) | ❌ | |

### Resident app
All 12 resident modules are ❌ — there is no resident entity or any "my room / my invoices / my complaints" endpoint.

---

## 5. Risks and limitations

1. **Data isolation.** List endpoints take no tenant or property filter. I need to confirm the backend scopes results to the logged-in user's business from the JWT. If it doesn't, an owner could see another business's data — this must be enforced server-side, not in the app.
2. **Admin endpoints are exposed to the same API.** `/tenants`, `/permissions`, `/roles` look like Super Admin functions. The mobile Owner/Resident app will not call them except where agreed (e.g. business profile), and the backend must block owners from managing other tenants.
3. **No parent filters or pagination.** Showing "beds in Room A-201" means loading all beds and filtering on the phone. Fine for a few hundred beds; will be slow and data-heavy at scale. Recommended: `?property_id=`, `?building_id=`, `?floor_id=`, `?room_id=`, `page`/`page_size`.
4. **Rent lives on both room and bed** (`monthly_rent` on each). Need the rule: which one wins on invoices?
5. **No upload endpoint** for property photos, KYC documents or bills.
6. **Field-level validation errors are hidden** in 422 responses.
7. **Server cold starts.** Render free tier may take 30–60 s to wake; the app will show a "connecting to server" state and use a longer first-request timeout.

---

## 6. What can be built now vs blocked

| Phase | Can start? |
|---|---|
| 3 Foundation (theme, components, API client with the envelope + 401/422 handling, navigation, secure token storage, refresh logic) | ✅ Yes |
| 4 Authentication — email/password login, refresh, logout | 🟡 Yes, once I see a real login response |
| 5.2–5.3 Properties, buildings, floors, rooms, beds | ✅ Yes, once I see real list responses |
| Everything else in Phases 5–6 | ❌ Blocked on backend endpoints |

---

## 7. Questions for the backend (in priority order)

1. **Test account + login response.** Provide a test owner login for a non-production environment so I can see exactly what `/auth/login` returns (tokens, expiry, user id, role, tenant id).
2. **Login method.** The wireframe uses mobile + OTP; the API uses email + password. Is OTP planned, or should the app follow email/password for now?
3. **Data scoping.** Does the backend filter all list endpoints by the JWT's tenant?
4. **Parent filters & pagination** — can these be added (list in §5.3)?
5. **Roadmap for the missing modules** — which comes next (Residents and Rent are the most important for the dashboard)?
6. **Room vs bed rent** — which is the source of truth?
7. **File uploads** — planned endpoint and storage?
