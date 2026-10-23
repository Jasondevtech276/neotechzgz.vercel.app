# Entorno remoto de desarrollo

Este repositorio está preparado para GitHub Codespaces. La configuración de `.devcontainer/devcontainer.json` instala Node.js 22, GitHub CLI y un servidor SSH, e instala las dependencias con `npm ci` al crear el entorno.

## Crear el Codespace

1. Abre https://github.com/Jasondevtech276/neotechzgz.vercel.app
2. Selecciona **Code → Codespaces → Create codespace**.
3. Elige la rama que quieras trabajar. Para el trabajo de seguridad, usa `fix/critical-npm-vulnerabilities` cuando la configuración de Codespaces ya esté disponible en la rama base, o espera a que se fusionen las PR de preparación.
4. En la terminal del Codespace, valida la sesión y el proyecto:

```bash
gh auth status
npm audit --audit-level=high
npm test
npm run build
```

GitHub Codespaces incluye una cuota gratuita mensual para cuentas personales; consulta **Settings → Billing and licensing → Usage** antes de usarlo. Detén el Codespace cuando termines para no consumir horas innecesarias.

## Preparar SSH para ChatGPT/Codex Desktop

La conexión con ChatGPT Desktop debe autorizarse desde tu propio ordenador; no se puede completar desde un conector de GitHub ni guardando un token en el repositorio.

1. Instala o actualiza GitHub CLI en Windows y autentícate con `gh auth login`.
2. Comprueba el nombre del Codespace con `gh codespace list`.
3. Genera la configuración SSH para los Codespaces (sustituye el nombre si necesitas seleccionar uno concreto):

```powershell
gh codespace ssh --config | Out-File -Append "$HOME\.ssh\config" -Encoding ascii
```

4. Verifica que SSH puede conectarse. Si el comando anterior contiene varios hosts, usa el alias correspondiente al Codespace:

```powershell
ssh -v <alias-ssh-del-codespace>
```

5. En la aplicación de escritorio de ChatGPT/Codex, abre **Settings → Connections**, añade el host SSH y selecciona la carpeta del repositorio. La documentación oficial describe este flujo en https://learn.chatgpt.com/docs/remote-connections.

**Seguridad:** no publiques claves privadas, tokens ni archivos de credenciales. No uses `gh auth login --with-token` con un token escrito en el chat. Mantén los puertos reenviados privados salvo que necesites compartirlos.

## Límites

Codespaces es un entorno remoto de desarrollo, no una conexión directa a tu PC físico. Para controlar el escritorio Windows local, debes configurar Remote Connections desde la aplicación de escritorio de ChatGPT en ese PC. El acceso remoto por SSH al Codespace es independiente.
