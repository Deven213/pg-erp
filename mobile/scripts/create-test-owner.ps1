# Creates a development/test Owner account using only documented PG ERP API endpoints (OpenAPI v0.1.0):
#   GET/POST /api/v1/tenants, GET/POST /api/v1/users, GET /api/v1/roles, GET/POST /api/v1/user-roles,
#   and POST /api/v1/auth/login for the final login check.
#
# For a BACKEND ADMINISTRATOR. Read docs/CREATE_TEST_OWNER.md first.
#
#   Dry run (default - read-only GETs, shows what would be created, sends no POST):
#     powershell -ExecutionPolicy Bypass -File .\scripts\create-test-owner.ps1 -BaseUrl https://<non-production-host>
#   Create for real:
#     powershell -ExecutionPolicy Bypass -File .\scripts\create-test-owner.ps1 -BaseUrl https://<non-production-host> -Execute
#
# Safety: no default server; you must type the host name to confirm it is non-production; the admin token and the
# new Owner's password are read with hidden prompts and never printed, logged or saved; nothing is deleted.

param(
  [Parameter(Mandatory = $true)][string]$BaseUrl,
  [switch]$Execute,         # without it, nothing is created
  [string]$TenantId,        # reuse an existing test business instead of creating one
  [string]$UserId,          # reuse an existing user (skip user creation)
  [string]$RoleId,          # pick the Owner role by id instead of by name
  [switch]$SetVerified,     # also send is_verified = true (only if the admin confirms login requires it)
  [switch]$SkipLoginTest
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$BaseUrl = $BaseUrl.TrimEnd('/')
$uuidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
foreach ($p in @{ TenantId = $TenantId; UserId = $UserId; RoleId = $RoleId }.GetEnumerator()) {
  if ($p.Value -and $p.Value -notmatch $uuidPattern) { Write-Host "-$($p.Key) must be a UUID."; exit 1 }
}

$script:adminToken = $null
$script:ownerPassword = $null

function Stop-Script([string]$msg) { throw [System.OperationCanceledException]::new($msg) }

# Calls the API. Returns the parsed ApiResponse. On HTTP errors prints only status + server message (never bodies
# that could contain user data or tokens) and stops.
function Invoke-Api([string]$Method, [string]$Path, $Body = $null, [switch]$NoAuth) {
  $headers = @{ Accept = 'application/json' }
  if (-not $NoAuth) { $headers.Authorization = "Bearer $script:adminToken" }
  $args_ = @{ Method = $Method; Uri = "$BaseUrl$Path"; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 90 }
  if ($null -ne $Body) {
    $args_.ContentType = 'application/json; charset=utf-8'
    $args_.Body = [Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 6))
  }
  try {
    $r = Invoke-WebRequest @args_
    $text = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
    return ($text | ConvertFrom-Json)
  } catch [System.OperationCanceledException] { throw }
  catch {
    $resp = $null
    if ($_.Exception.PSObject.Properties['Response']) { $resp = $_.Exception.Response }
    if (-not $resp) { Stop-Script "$Method $Path failed before any HTTP response: $($_.Exception.Message)" }
    $status = [int]$resp.StatusCode
    $msg = ''
    try {
      $j = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() | ConvertFrom-Json
      $msg = "$($j.message) $($j.errorMessage)".Trim()
    } catch { }
    $hint = switch ($status) {
      401 { if ($NoAuth) { ' -> email/password rejected, or the account is inactive.' } else { ' -> the admin token is missing, invalid or expired. Get a fresh one and rerun.' } }
      403 { ' -> this account is not allowed to do this. An administrator token is required.' }
      422 { ' -> the server rejected the data (see message). Check the values you entered.' }
      default { '' }
    }
    Stop-Script "$Method $Path failed: HTTP $status. $msg$hint"
  }
}

# Finds objects anywhere in a response that have a UUID 'id' and $Field equal to $Value.
# Uses only field names documented in the *Upsert schemas; the response 'data' shape itself is undocumented.
function Find-Records($node, [string]$Field, [string]$Value) {
  $found = @()
  if ($null -eq $node -or $node -is [string] -or $node -is [ValueType]) { return ,$found }
  if ($node -is [System.Collections.IEnumerable]) {
    foreach ($item in $node) { $found += Find-Records $item $Field $Value }
    return ,$found
  }
  $props = $node.PSObject.Properties
  if ($props['id'] -and "$($node.id)" -match $uuidPattern -and $props[$Field] -and "$($node.$Field)" -ieq $Value) { $found += $node }
  foreach ($p in $props) {
    if ($p.Value -is [psobject] -or ($p.Value -is [System.Collections.IEnumerable] -and $p.Value -isnot [string])) {
      $found += Find-Records $p.Value $Field $Value
    }
  }
  return ,$found
}

function Select-SingleId($records, [string]$what) {
  $ids = @($records | ForEach-Object { "$($_.id)" } | Sort-Object -Unique)
  if ($ids.Count -eq 1) { return $ids[0] }
  if ($ids.Count -gt 1) { Stop-Script "More than one $what matched ($($ids -join ', ')). Rerun with the right id parameter." }
  return $null
}

function Read-Required([string]$prompt, [int]$max) {
  while ($true) {
    $v = (Read-Host $prompt).Trim()
    if ($v.Length -ge 1 -and $v.Length -le $max) { return $v }
    Write-Host "  Required, 1-$max characters."
  }
}

function Read-NewPassword {
  while ($true) {
    $a = Read-Host "New Owner password (8-128 chars, hidden)" -AsSecureString
    $b = Read-Host "Repeat password (hidden)" -AsSecureString
    $pa = [System.Net.NetworkCredential]::new('', $a).Password
    $pb = [System.Net.NetworkCredential]::new('', $b).Password
    if ($pa -ne $pb) { Write-Host "  Passwords do not match."; continue }
    if ($pa.Length -lt 8 -or $pa.Length -gt 128) { Write-Host "  Must be 8-128 characters."; continue }
    return $pa
  }
}

function Show-Body($body) {
  $copy = [ordered]@{}
  foreach ($k in $body.Keys) { $copy[$k] = if ($k -eq 'password') { '<hidden>' } else { $body[$k] } }
  [pscustomobject]$copy | ConvertTo-Json
}

try {
  Write-Host "=== PG ERP - create test Owner ($(if ($Execute) { 'EXECUTE' } else { 'DRY RUN: nothing will be created' })) ===`n"

  # --- 0. Environment confirmation ------------------------------------------------------------------------------
  $hostName = ([Uri]$BaseUrl).Host
  Write-Host "Target server: $BaseUrl"
  Write-Host "This script must NOT be run against production."
  $typed = (Read-Host "Type the host name ($hostName) to confirm it is a NON-PRODUCTION environment").Trim()
  if ($typed -ne $hostName) { Stop-Script "Host name not confirmed. Nothing was sent." }

  $spec = Invoke-Api GET '/openapi.json' -NoAuth
  Write-Host "API: $($spec.info.title) $($spec.info.version)"
  foreach ($path in '/api/v1/tenants', '/api/v1/users', '/api/v1/roles', '/api/v1/user-roles', '/api/v1/auth/login') {
    if (-not $spec.paths.$path) { Stop-Script "This server's spec has no $path - it differs from v0.1.0. Stop and check with the backend team." }
  }

  # --- 1. Admin token -----------------------------------------------------------------------------------------------
  $secureToken = Read-Host "Admin access token (hidden - paste the JWT without 'Bearer ')" -AsSecureString
  $script:adminToken = ([System.Net.NetworkCredential]::new('', $secureToken).Password).Trim()
  if ($script:adminToken -like 'Bearer *') { $script:adminToken = $script:adminToken.Substring(7).Trim() }
  if (-not $script:adminToken) { Stop-Script "No token entered." }
  $null = Invoke-Api GET '/api/v1/roles'
  Write-Host "Admin token accepted.`n"

  # --- 2. Owner role (never assumed) --------------------------------------------------------------------------------
  $rolesResp = Invoke-Api GET '/api/v1/roles'
  function Get-Roles($node) {
    if ($null -eq $node -or $node -is [string] -or $node -is [ValueType]) { return }
    if ($node -is [System.Collections.IEnumerable]) { foreach ($i in $node) { Get-Roles $i }; return }
    if ($node.PSObject.Properties['id'] -and "$($node.id)" -match $uuidPattern -and $node.PSObject.Properties['name']) { $script:roleList += $node }
  }
  $script:roleList = @()
  Get-Roles $rolesResp.data
  if ($script:roleList.Count -eq 0) { Stop-Script "GET /roles returned no roles with 'id' and 'name'. The Owner role must be set up by the backend team first." }
  Write-Host "Roles on this server:"
  $script:roleList | ForEach-Object { [pscustomobject]@{ name = $_.name; id = $_.id; description = $_.description } } | Format-Table -AutoSize | Out-String | Write-Host
  if ($RoleId) {
    $role = $script:roleList | Where-Object { "$($_.id)" -eq $RoleId }
    if (-not $role) { Stop-Script "-RoleId $RoleId is not in the role list above." }
  } else {
    $roleName = (Read-Host "Type the EXACT name of the role the backend uses for PG Owners (confirm with the backend team)").Trim()
    $role = @($script:roleList | Where-Object { "$($_.name)" -ceq $roleName })
    if ($role.Count -ne 1) { Stop-Script "Role '$roleName' not found exactly once (names are case-sensitive)." }
    $role = $role[0]
  }
  $RoleId = "$($role.id)"
  Write-Host "Owner role: '$($role.name)' ($RoleId)`n"

  # --- 3. Test business (tenant) ------------------------------------------------------------------------------------
  if ($TenantId) {
    $t = Select-SingleId (Find-Records (Invoke-Api GET "/api/v1/tenants?id=$TenantId").data 'id' $TenantId) 'tenant'
    if (-not $t) { Stop-Script "Tenant $TenantId not found." }
    Write-Host "Using existing tenant $TenantId`n"
  } else {
    Write-Host "Test PG business (use obviously fake/test details):"
    $tenantBody = [ordered]@{
      business_name = Read-Required "  Business name (e.g. 'TEST PG - Dev')" 200
      owner_name    = Read-Required "  Owner name" 150
      email         = Read-Required "  Business email" 255
      status        = 'active'
    }
    $existing = Select-SingleId (Find-Records (Invoke-Api GET '/api/v1/tenants').data 'email' $tenantBody.email) 'tenant'
    if ($existing) { Stop-Script "A tenant with email $($tenantBody.email) already exists ($existing). To use it, rerun with -TenantId $existing." }
    Write-Host "POST /api/v1/tenants"; Show-Body $tenantBody | Write-Host
    if ($Execute) {
      $resp = Invoke-Api POST '/api/v1/tenants' $tenantBody
      Write-Host "  -> $($resp.message)"
      $TenantId = Select-SingleId (Find-Records $resp.data 'email' $tenantBody.email) 'tenant'
      if (-not $TenantId) { $TenantId = Select-SingleId (Find-Records (Invoke-Api GET '/api/v1/tenants').data 'email' $tenantBody.email) 'tenant' }
      if (-not $TenantId) { Stop-Script "Tenant was submitted but its id could not be found. Look it up with GET /api/v1/tenants and rerun with -TenantId <id>." }
      Write-Host "  Tenant id: $TenantId`n"
    } else { $TenantId = '<new tenant id>' }
  }

  # --- 4. Owner user ------------------------------------------------------------------------------------------------
  if ($UserId) {
    $u = Select-SingleId (Find-Records (Invoke-Api GET "/api/v1/users?id=$UserId").data 'id' $UserId) 'user'
    if (-not $u) { Stop-Script "User $UserId not found." }
    Write-Host "Using existing user $UserId (its password is NOT changed)`n"
    $SkipLoginTest = $true
  } else {
    Write-Host "Owner user:"
    $userBody = [ordered]@{
      tenant_id     = $TenantId
      full_name     = Read-Required "  Full name" 150
      email         = Read-Required "  Login email (a test address, not a real person's)" 255
      mobile_number = Read-Required "  Mobile number" 20
      password      = $null
      is_active     = $true
    }
    if ($SetVerified) { $userBody.is_verified = $true }
    $existing = Select-SingleId (Find-Records (Invoke-Api GET '/api/v1/users').data 'email' $userBody.email) 'user'
    if ($existing) { Stop-Script "A user with email $($userBody.email) already exists ($existing). Choose another email, or rerun with -UserId $existing." }
    $script:ownerPassword = Read-NewPassword
    $userBody.password = $script:ownerPassword
    Write-Host "POST /api/v1/users"; Show-Body $userBody | Write-Host
    if ($Execute) {
      $resp = Invoke-Api POST '/api/v1/users' $userBody
      $userBody.password = $null
      Write-Host "  -> $($resp.message)"
      $UserId = Select-SingleId (Find-Records $resp.data 'email' $userBody.email) 'user'
      if (-not $UserId) { $UserId = Select-SingleId (Find-Records (Invoke-Api GET '/api/v1/users').data 'email' $userBody.email) 'user' }
      if (-not $UserId) { Stop-Script "User was submitted but its id could not be found. Look it up with GET /api/v1/users and rerun with -TenantId $TenantId -UserId <id>." }
      Write-Host "  User id: $UserId`n"
    } else { $UserId = '<new user id>' }
    $ownerEmail = $userBody.email
  }

  # --- 5. Assign Owner role for this tenant -------------------------------------------------------------------------
  $linkBody = [ordered]@{ user_id = $UserId; role_id = $RoleId; tenant_id = $TenantId }
  Write-Host "POST /api/v1/user-roles"; Show-Body $linkBody | Write-Host
  if (-not $Execute) {
    Write-Host "`nDRY RUN finished: nothing was created. Rerun with -Execute to create these records."
    return
  }
  $links = Find-Records (Invoke-Api GET '/api/v1/user-roles').data 'user_id' $UserId
  $match = @($links | Where-Object { "$($_.role_id)" -eq $RoleId -and "$($_.tenant_id)" -eq $TenantId })
  if ($match.Count -gt 0) { Write-Host "  Already assigned - skipped.`n" }
  else { $resp = Invoke-Api POST '/api/v1/user-roles' $linkBody; Write-Host "  -> $($resp.message)`n" }

  # --- 6. Verify user <-> tenant <-> role ---------------------------------------------------------------------------
  Write-Host "Verifying..."
  $checks = [ordered]@{}
  $recs = Find-Records (Invoke-Api GET "/api/v1/users?id=$UserId").data 'id' $UserId; $user = if ($recs.Count -gt 0) { $recs[0] } else { $null }
  $checks['User exists'] = [bool]$user
  if ($user) {
    $checks['User tenant_id = test tenant'] = ("$($user.tenant_id)" -eq $TenantId)
    $checks['User is_active = true'] = if ($user.PSObject.Properties['is_active']) { [bool]$user.is_active } else { 'field not returned - confirm with backend' }
    $checks['User is_verified'] = if ($user.PSObject.Properties['is_verified']) { [bool]$user.is_verified } else { 'field not returned' }
  }
  $recs = Find-Records (Invoke-Api GET "/api/v1/tenants?id=$TenantId").data 'id' $TenantId; $tenant = if ($recs.Count -gt 0) { $recs[0] } else { $null }
  $checks['Tenant exists'] = [bool]$tenant
  if ($tenant -and $tenant.PSObject.Properties['status']) { $checks['Tenant status'] = "$($tenant.status)" }
  $links = Find-Records (Invoke-Api GET '/api/v1/user-roles').data 'user_id' $UserId
  $checks['Owner role assigned for this tenant'] = (@($links | Where-Object { "$($_.role_id)" -eq $RoleId -and "$($_.tenant_id)" -eq $TenantId }).Count -gt 0)
  $checks.GetEnumerator() | ForEach-Object { Write-Host ("  {0,-38} {1}" -f $_.Key, $_.Value) }
  Write-Host "`nIDs (not secret): tenant $TenantId | user $UserId | role $RoleId"

  # --- 7. Login check (shape only, no token values) -----------------------------------------------------------------
  if (-not $SkipLoginTest -and $script:ownerPassword) {
    Write-Host "`nTesting login as the new Owner..."
    $loginBody = @{ email = $ownerEmail; password = $script:ownerPassword }
    try {
      $login = Invoke-Api POST '/api/v1/auth/login' $loginBody -NoAuth
      Write-Host "  LOGIN OK: $($login.message)"
      if ($login.data -is [psobject]) { Write-Host "  Fields returned in data (values not shown): $(@($login.data.PSObject.Properties.Name) -join ', ')" }
    } catch [System.OperationCanceledException] { Write-Host "  LOGIN FAILED: $($_.Exception.Message)" }
    finally { $loginBody = $null }
  }
  Write-Host "`nDone. Give the Owner's email to the mobile developer; share the password privately, never in chat or tickets."
}
catch [System.OperationCanceledException] { Write-Host "`nSTOPPED: $($_.Exception.Message)"; exit 1 }
finally { $script:adminToken = $null; $script:ownerPassword = $null }
