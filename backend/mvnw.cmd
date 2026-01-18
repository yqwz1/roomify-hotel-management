@ECHO OFF
REM Lightweight wrapper: uses Maven if installed.
where mvn >NUL 2>&1
IF %ERRORLEVEL% NEQ 0 (
  ECHO Maven (mvn) is not installed. Install Maven or add a full Maven Wrapper.
  EXIT /B 1
)
mvn %*
