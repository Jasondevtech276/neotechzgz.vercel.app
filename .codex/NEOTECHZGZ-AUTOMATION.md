# Neotechzgz — automatización de agentes

Este documento define qué puede ejecutarse automáticamente y qué requiere aprobación.

## Delegación por especialidad
- Desarrollo: Frontend/Backend + Code Reviewer + Test Automation Engineer.
- Datos: Database Optimizer + Backend Architect + Security Architect (solo lectura por defecto).
- Plataforma: DevOps Automator + SRE + Security Architect.
- Seguridad: Application Security Engineer + Secrets & Credential Hygiene Engineer.
- SEO/contenido: SEO Specialist + Content Creator + Growth Hacker (informes y borradores).
- Publicidad: PPC Campaign Strategist + Paid Social Strategist + Ad Creative Strategist + Tracking & Measurement Specialist (planes, no publicación).
- Conversión: E-commerce & Conversion Architect + Growth Hacker + SEO Specialist.

## Acciones autónomas permitidas
Lectura, análisis, clasificación, tests locales, lint, typecheck, build, borradores, planes y diffs locales reversibles. Cada hallazgo debe incluir evidencia y prioridad.

## Acciones siempre bloqueadas hasta aprobación
Merge; push a ramas protegidas; despliegue Production; cambios de estado, datos, esquema, RLS o permisos en Supabase; secretos y variables de producción; DNS; Stripe LIVE, Checkout, cobros o precios cobrables; escrituras en CRM; envíos, outreach, publicaciones, carga de audiencias y gasto publicitario.

## Rutinas recurrentes
1. Semanal: salud de GitHub/Vercel, CI, PRs, dependencias y riesgos.
2. Semanal: informe de SEO, contenido y conversión con fuentes disponibles; sin publicación.
3. Mensual: arquitectura, seguridad, continuidad, backups, permisos y deuda técnica.

Los archivos TOML habilitan subagentes de Codex; no programan por sí mismos ejecuciones recurrentes. Las rutinas recurrentes se gestionan mediante el programador de tareas conectado y se limitan a auditoría de solo lectura.

## Evidencia y manejo de fallos
Registrar fecha, commit/entorno consultado, fuentes, limitaciones de acceso y acciones pendientes. No asumir que una tarea se ejecutó si el conector falló. Nunca imprimir secretos ni datos personales innecesarios.
