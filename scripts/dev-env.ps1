$ErrorActionPreference = 'Stop'

# Project-local dev environment bootstrap for Windows
$defaultJdk = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
$defaultMaven = 'C:\Users\khaye\tools\apache-maven-3.9.9'

if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
  $env:JAVA_HOME = $defaultJdk
}
if (-not $env:MAVEN_HOME -or -not (Test-Path $env:MAVEN_HOME)) {
  $env:MAVEN_HOME = $defaultMaven
}

if (-not (Test-Path $env:JAVA_HOME)) {
  throw "JAVA_HOME not found: $($env:JAVA_HOME)"
}
if (-not (Test-Path $env:MAVEN_HOME)) {
  throw "MAVEN_HOME not found: $($env:MAVEN_HOME)"
}

$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;" + $env:Path

Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "MAVEN_HOME=$env:MAVEN_HOME"
java -version
mvn -version
