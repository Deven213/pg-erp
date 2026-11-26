# Shows the SHAPE of the /auth/login response so the app's auth contract can be confirmed,
# without printing tokens or the password. Run it yourself in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\scripts\inspect-login.ps1
# Paste the printed output back to the developer. Long strings (tokens) are masked.

param(
  [string]$BaseUrl = "https://pg-erp.onrender.com"
)

$ErrorActionPreference = "Stop"
# Windows PowerShell 5.1 can fall back to old TLS versions; make sure TLS 1.2 is allowed.
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$BaseUrl = $BaseUrl.TrimEnd('/')
$loginUrl = "$BaseUrl/api/v1/auth/login"

function Hide-Values($value) {
  if ($null -eq $value) { return $null }
  if ($value -is [string]) {
    if ($value.Length -gt 24) { return "<string, $($value.Length) chars, starts '$($value.Substring(0,4))'>" }
    return $value
  }
  if ($value -is [System.Collections.IEnumerable] -and -not ($value -is [string])) {
    return @($value | ForEach-Object { Hide-Values $_ })
  }
  if ($value -is [psobject] -and $value.PSObject.Properties.Count -gt 0 -and -not ($value -is [ValueType])) {
    $out = [ordered]@{}
    foreach ($p in $value.PSObject.Properties) { $out[$p.Name] = Hide-Values $p.Value }
    return [pscustomobject]$out
  }
  return $value
}

# Describes a failed request: HTTP status + the server's JSON message, or the network-level cause.
function Write-Failure($err, [string]$what) {
  $ex = $err.Exception
  $resp = $null
  if ($ex.PSObject.Properties['Response']) { $resp = $ex.Response }
  if ($resp) {
    $status = [int]$resp.StatusCode
    Write-Host "$what failed: HTTP $status $($resp.StatusDescription)"
    $text = $err.ErrorDetails.Message
    if (-not $text) {
      try { $reader = New-Object IO.StreamReader($resp.GetResponseStream()); $text = $reader.ReadToEnd() } catch { }
    }
    if ($text) {
      try {
        $json = $text | ConvertFrom-Json
        # The error envelope's text fields are plain messages, never tokens - show them in full; mask anything else.
        Write-Host "Server message:      $($json.message)"
        Write-Host "Server errorMessage: $($json.errorMessage)"
        if ($null -ne $json.data) { Write-Host "Server data (masked):"; Hide-Values $json.data | ConvertTo-Json -Depth 8 }
      }
      catch { Write-Host "Server response (not JSON, first 300 chars): $($text.Substring(0, [Math]::Min(300, $text.Length)))" }
    }
    switch ($status) {
      401 { Write-Host "`nMeaning: the server is reachable and rejected these credentials (wrong email/password, or the account is inactive)." }
      422 { Write-Host "`nMeaning: the request was rejected as invalid (empty or too-long email/password)." }
      { $_ -ge 500 } { Write-Host "`nMeaning: server-side error. Try again in a minute; if it repeats, the backend needs checking." }
    }
    return
  }
  # No HTTP response: DNS, TLS, connection or timeout problem.
  $inner = $ex
  while ($inner.InnerException) { $inner = $inner.InnerException }
  Write-Host "$what failed before any HTTP response."
  Write-Host "Error type: $($ex.GetType().FullName)"
  if ($ex -is [System.Net.WebException]) { Write-Host "Network status: $($ex.Status)" }
  Write-Host "Message: $($ex.Message)"
  if ($inner -ne $ex) { Write-Host "Root cause: $($inner.GetType().Name): $($inner.Message)" }
}

# 1. Reachability check (no credentials): is the server up and answering over HTTPS?
Write-Host "PowerShell $($PSVersionTable.PSVersion) - checking $BaseUrl ..."
try {
  $host_ = ([Uri]$BaseUrl).Host
  $ips = [System.Net.Dns]::GetHostAddresses($host_) | ForEach-Object { $_.IPAddressToString }
  Write-Host "DNS: $host_ -> $($ips -join ', ')"
} catch { Write-Host "DNS lookup failed for $BaseUrl : $($_.Exception.Message)"; exit 1 }

$sw = [Diagnostics.Stopwatch]::StartNew()
try {
  $health = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/openapi.json" -TimeoutSec 90
  Write-Host "Server reachable: HTTP $($health.StatusCode) in $([Math]::Round($sw.Elapsed.TotalSeconds, 1)) s (a first call can take ~60 s while the server wakes up)"
} catch { Write-Failure $_ "Reachability check"; exit 1 }

# 2. Login
$email = (Read-Host "Test account email").Trim()
if ($email -match '[\[\]\(\)<>\s]' -or $email -like 'mailto:*') {
  Write-Host "The email contains extra characters ('$email'). Type only the plain address, e.g. name@example.com."
  exit 1
}
$secure = Read-Host "Password" -AsSecureString
$password = [System.Net.NetworkCredential]::new("", $secure).Password
Write-Host "Sending POST $loginUrl (email: $email, password not shown)"

try {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $sw.Restart()
  $response = Invoke-RestMethod -Method Post -Uri $loginUrl -ContentType "application/json" -Body $body -TimeoutSec 90
  Write-Host "Login succeeded in $([Math]::Round($sw.Elapsed.TotalSeconds, 1)) s"
  Write-Host "`nLogin response (tokens masked):`n"
  Hide-Values $response | ConvertTo-Json -Depth 8

  # If an access token is present, show its claims too (long values masked) - this is where roles often live.
  $token = $response.data.access_token
  if ($token -is [string] -and $token.Split('.').Count -eq 3) {
    $part = $token.Split('.')[1].Replace('-', '+').Replace('_', '/')
    switch ($part.Length % 4) { 2 { $part += '==' } 3 { $part += '=' } }
    $claims = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($part)) | ConvertFrom-Json
    Write-Host "`nAccess token claims (long values masked):`n"
    Hide-Values $claims | ConvertTo-Json -Depth 8
  } else {
    Write-Host "`n(No 'data.access_token' field found - please share the output above.)"
  }
} catch {
  Write-Failure $_ "Login"
} finally {
  $password = $null
  $body = $null
}
