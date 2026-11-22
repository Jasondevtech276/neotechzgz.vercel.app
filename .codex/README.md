# Agency Agents — integración Neotechzgz

Esta integración contiene una selección de 17 perfiles de Agency Agents convertidos al formato TOML de agentes personalizados de Codex.

## Procedencia

- Repositorio: https://github.com/msitarzewski/agency-agents
- Commit de origen fijado: `8ae6164602c95ca78828b148b9052460ee426885`
- Formato: `name`, `description` y `developer_instructions`
- Licencia: MIT; texto conservado en `THIRD_PARTY_NOTICES.md`.

## Perfiles incluidos

- AI Engineer
- API Platform Engineer
- Backend Architect
- Code Reviewer
- Database Optimizer
- DevOps Automator
- Frontend Developer
- Identity & Access Engineer
- Multi-Agent Systems Architect
- Platform Engineer
- Privacy Engineer
- Software Architect
- SRE
- Application Security Engineer
- Security Architect
- Secrets & Credential Engineer
- Test Automation Engineer

## Uso

Los agentes están versionados en `.codex/agents/*.toml`. En Codex, selecciona el agente por su nombre o solicítalo expresamente en una tarea. Comprueba primero que el cliente Codex reconoce los agentes del proyecto; el formato se ha convertido, pero la activación no se ha probado en un cliente local.

## Seguridad y límites

- Los perfiles son instrucciones de terceros y se consideran no confiables hasta revisión.
- No se ejecutó ningún script del repositorio upstream.
- No se conceden permisos, herramientas, credenciales ni acceso a producción por instalar estos archivos.
- Las reglas de `AGENTS.md` del proyecto prevalecen sobre los perfiles importados.
- No se instalaron los 230+ perfiles del repositorio completo: se eligió una selección de 17 enfocada en la arquitectura, desarrollo, operaciones y seguridad de Neotechzgz.
- No se importan ni se ejecutan binarios, dependencias o scripts del proyecto upstream.

## Actualización

Para actualizar, fija primero un nuevo commit upstream, revisa los cambios de los perfiles, regenera los TOML y somete el resultado a PR. No sigas `main` automáticamente.
