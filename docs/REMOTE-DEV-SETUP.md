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
3. Antes de modificar la configuración SSH, haz una copia de seguridad si ya tienes un archivo `$HOME\\.ssh\\config`. Genera la configuración para los Codespaces y revisa la salida antes de añadirla para evitar entradas duplicadas:

```powershell
gh codespace ssh --config
```

Copia al archivo `$HOME\\.ssh\\config` únicamente las entradas que no existan ya. No sobrescribas tu configuración SSH existente.

4. Verifica que SSH puede conectarse. Usa el alias que aparece en la configuración generada:

```powershell
ssh -v <alias-ssh-del-codespace>
```

5. En la aplicación de escritorio de ChatGPT/Codex, abre **Settings → Connections** y sigue las instrucciones disponibles en tu versión para añadir el host SSH y seleccionar la carpeta del repositorio. La disponibilidad y los nombres exactos de las opciones pueden variar según la aplicación y la versión.

**Seguridad:** no publiques claves privadas, tokens ni archivos de credenciales. No uses `gh auth login --with-token` con un token escrito en el chat. Mantén los puertos reenviados privados salvo que necesites compartirlos.

## Límites

Codespaces es un entorno remoto de desarrollo, no una conexión directa a tu PC físico. Para controlar el escritorio Windows local, debes configurar Remote Connections desde la aplicación de escritorio de ChatGPT en ese PC. El acceso remoto por SSH al Codespace es independiente.
