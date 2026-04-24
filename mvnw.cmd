@echo off
setlocal

if defined MAVEN_HOME (
  set "_MAVEN_HOME=%MAVEN_HOME%"
) else (
  set "_MAVEN_HOME=C:\Users\khaye\tools\apache-maven-3.9.9"
)

if not exist "%_MAVEN_HOME%\bin\mvn.cmd" (
  echo [mvnw.cmd] Maven not found at "%_MAVEN_HOME%".
  echo Install Maven or set MAVEN_HOME first.
  exit /b 1
)

if not defined JAVA_HOME (
  if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
  )
)

"%_MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
