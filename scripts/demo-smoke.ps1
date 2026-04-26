param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/5] Health check..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/health"
Write-Host "  OK health endpoint" -ForegroundColor Green

Write-Host "[2/5] Login parent..." -ForegroundColor Cyan
$loginBody = @{ email = "parent@demo.local"; motDePasse = "demo1234" } | ConvertTo-Json
$null = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" -Body $loginBody -SessionVariable session
Write-Host "  OK login parent" -ForegroundColor Green

Write-Host "[3/5] Maintenance list..." -ForegroundColor Cyan
$maintenance = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/gestion/maintenance" -WebSession $session
$count = @($maintenance).Count
Write-Host "  items maintenance: $count" -ForegroundColor Green
if ($count -lt 3) {
  throw "Maintenance demo insuffisante: attendu >=3, obtenu $count"
}

Write-Host "[4/5] MachineCafe prepare + refill..." -ForegroundColor Cyan
$objets = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/gestion/objets" -WebSession $session
$mc = $objets | Where-Object { $_.type -eq "MachineCafe" } | Select-Object -First 1
if (-not $mc) { throw "Aucune MachineCafe trouvée" }

$prepareBody = @{
  type = $mc.type
  nom = $mc.nom
  pieceId = $mc.pieceId
  coffeeAction = "preparer"
  boisson = "ESPRESSO"
} | ConvertTo-Json
$null = Invoke-RestMethod -Method PUT -Uri "$BaseUrl/api/gestion/objets/$($mc.id)" -WebSession $session -ContentType "application/json" -Body $prepareBody

$refillWaterBody = @{
  type = $mc.type
  nom = $mc.nom
  pieceId = $mc.pieceId
  coffeeAction = "remplir-eau"
} | ConvertTo-Json
$null = Invoke-RestMethod -Method PUT -Uri "$BaseUrl/api/gestion/objets/$($mc.id)" -WebSession $session -ContentType "application/json" -Body $refillWaterBody

$refillCoffeeBody = @{
  type = $mc.type
  nom = $mc.nom
  pieceId = $mc.pieceId
  coffeeAction = "remplir-cafe"
} | ConvertTo-Json
$updated = Invoke-RestMethod -Method PUT -Uri "$BaseUrl/api/gestion/objets/$($mc.id)" -WebSession $session -ContentType "application/json" -Body $refillCoffeeBody

Write-Host "  OK MachineCafe: eau=$($updated.niveauEau) cafe=$($updated.niveauCafe)" -ForegroundColor Green

Write-Host "[5/5] Scenarios endpoint..." -ForegroundColor Cyan
$scenarios = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/gestion/scenarios" -WebSession $session
Write-Host "  scenarios disponibles: $(@($scenarios).Count)" -ForegroundColor Green

Write-Host "`n✅ Demo smoke test PASSED" -ForegroundColor Green
