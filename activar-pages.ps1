# Script para activar GitHub Pages en el repositorio
# Requiere: token de GitHub con permisos repo
# Uso: .\activar-pages.ps1 -Token "ghp_xxxx"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$repo = "eliecerzunigab-gif/APP_CARCELES_CHILE"
$url = "https://api.github.com/repos/$repo/pages"

$body = @{
    source = @{
        branch = "gh-pages"
        path   = "/"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer $Token"
        "Accept" = "application/vnd.github.v3+json"
    }
    Write-Host "✅ GitHub Pages activado exitosamente!" -ForegroundColor Green
    Write-Host "🌐 URL: https://eliecerzunigab-gif.github.io/APP_CARCELES_CHILE/" -ForegroundColor Cyan
    Write-Host "⏳ Espera 1-2 minutos para que se propague..." -ForegroundColor Yellow
} catch {
    $err = $_.Exception.Message
    if ($err -match "409") {
        Write-Host "⚠️ GitHub Pages ya está configurado. Intentando actualizar..." -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri $url -Method PUT -Body $body -ContentType "application/json" -Headers @{
                "Authorization" = "Bearer $Token"
                "Accept" = "application/vnd.github.v3+json"
            }
            Write-Host "✅ GitHub Pages actualizado!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}
