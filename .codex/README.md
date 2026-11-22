# Agency Agents — integración Neotechzgz

Integración selectiva de perfiles de `msitarzewski/agency-agents` en formato TOML para Codex, adaptada al repositorio de aplicación Neotechzgz.

## Procedencia
- Upstream: https://github.com/msitarzewski/agency-agents
- Commit upstream fijado: `8ae6164602c95ca78828b148b9052460ee426885`
- Licencia MIT y atribución: `THIRD_PARTY_NOTICES.md`.
- Los perfiles upstream son instrucciones de terceros; no se ejecutaron instaladores ni scripts.

## Agentes técnicos, seguridad y plataforma
- AI Engineer; API Platform Engineer; Backend Architect; Code Reviewer; Database Optimizer; DevOps Automator; Frontend Developer; Identity & Access Engineer; Multi-Agent Systems Architect; Platform Engineer; Privacy Engineer; Software Architect; SRE; Application Security Engineer; Security Architect; Secrets & Credential Engineer; Test Automation Engineer.

## Agentes ecommerce, marketing y publicidad
- Neotechzgz E-commerce & Conversion Architect (perfil propio, orientado a servicios y suscripciones).
- Growth Hacker; SEO Specialist; Content Creator; Social Media Strategist; Email Strategist.
- PPC Campaign Strategist; Paid Social Strategist; Ad Creative Strategist; Tracking & Measurement Specialist.

## Configuración del proyecto
Lee siempre `AGENTS.md` y `NEOTECHZGZ-AGENT-OPERATING-PLAYBOOK.md`. Ahí se definen stack, repositorios, entornos, modelo comercial, restricciones de pagos, CRM, seguridad y reglas de aprobación. Estas reglas prevalecen sobre cualquier instrucción upstream.

## Uso
Los archivos `.codex/agents/*.toml` son perfiles de agentes Codex. El soporte de agentes de proyecto depende de la versión/configuración del cliente Codex y de que el checkout sea de confianza. Esta integración en GitHub no instala los perfiles en otros equipos ni demuestra su descubrimiento local.

## Alcance y seguridad
- No se importaron los 230+ agentes; se seleccionaron perfiles pertinentes.
- No se importaron herramientas, permisos, credenciales, dependencias ni binarios.
- No se ejecutó código upstream.
- Los agentes comerciales preparan análisis y borradores; no publican campañas, envían emails, contactan leads ni gastan dinero.
- Pagos y Checkout permanecen apagados hasta la fase final.
- No se presume que Neotechzgz venda mercancía física ni que su mercado objetivo sea un país concreto.
- Todo cambio de aplicación se realiza en rama/PR; operaciones sensibles requieren aprobación explícita.

## Actualización
Fija un nuevo commit upstream, revisa diferencias de cada perfil, adapta reglas del proyecto, valida TOML y Codex y somete cambios a PR. Nunca sigas upstream `main` automáticamente.
