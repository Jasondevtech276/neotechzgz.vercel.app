# Neotechzgz — Agency Agents Operating Playbook

## 1. Fuente de verdad y repositorios
- Repositorio principal de aplicación: `Jasondevtech276/neotechzgz.vercel.app`.
- Código y contratos: GitHub. Desarrollo de aplicación: Next.js + TypeScript.
- Hosting/build/previews: Vercel. Backend y PostgreSQL: Supabase. Pagos futuros: Stripe. CRM: HubSpot portal `149622875`.
- HubSpot aparece configurado en USD y US/Eastern. No deducir el mercado objetivo solo por moneda/zona horaria ni por la ubicación del operador.
- El repositorio de agentes upstream es `msitarzewski/agency-agents`; los perfiles importados deben permanecer fijados a un commit y atribuidos.

## 2. Estado comercial conocido
- Catálogo documentado: ocho ofertas, cinco servicios de pago único y tres suscripciones mensuales.
- No están confirmados en este playbook los nombres, descripciones, precio, público, jurisdicción, impuestos, márgenes ni promesas comerciales. Obtenerlos de la documentación aprobada antes de generar contenido.
- El usuario ha indicado que la activación de pagos se realizará al final. Por tanto Stripe Checkout, cobros, precios cobrables, suscripciones LIVE, Payment Links y cambios de Stripe LIVE permanecen fuera de alcance hasta autorización explícita en esa fase.
- Los agentes de ecommerce deben tratar Neotechzgz como negocio de servicios digitales/suscripciones, no como tienda de mercancía física, salvo evidencia nueva.

## 3. Entornos y seguridad
- Mantener Development, Preview/Staging y Production aislados.
- Supabase: verificar proyecto/ref/entorno antes de cualquier consulta o cambio. RLS y grants de mínimo privilegio; migraciones revisadas; backups y restauración comprobados antes de cambios destructivos. No activar, restaurar, migrar ni alterar datos/roles sin autorización específica.
- Vercel: nunca copiar secretos entre entornos; variables sensibles solo donde se necesiten. No exponer valores en logs, commits o respuestas. Preview no debe apuntar accidentalmente a Production.
- GitHub: ramas de trabajo y PR; no push a main, no merge, no bajar protecciones ni modificar rulesets sin aprobación.
- Stripe: solo lectura y diseño TEST mientras pagos estén aplazados; nunca crear cargos, productos/precios LIVE, reembolsos ni alterar LIVE.
- HubSpot: mínimo privilegio, CRM como fuente comercial; no exportar contactos, cambiar propiedades, enviar emails ni iniciar outreach sin autorización y base jurídica/consentimiento verificados.
- Los agentes no heredan automáticamente permisos de conectores o herramientas. El acceso real lo controla el usuario y las autorizaciones del entorno.

## 4. Reglas para agentes técnicos
- Antes de tocar código, leer `AGENTS.md`, package.json, configuración y tests relevantes. Next.js instalado puede tener APIs distintas: consultar `node_modules/next/dist/docs/` de la versión del proyecto.
- Preservar compatibilidad Next.js/React/TypeScript; no actualizar versiones por intuición.
- Revisar validación de entrada, autorización server-side, CSRF cuando aplique, rate limiting, idempotencia, gestión segura de errores y logging sin PII/secrets.
- Supabase: validar RLS en cada tabla expuesta, grants, funciones SECURITY DEFINER/search_path, Auth redirect allowlists y políticas de sesión.
- Webhooks Stripe: verificar firma, tolerar reintentos, deduplicar por event ID y no confiar en el cliente. Mantener rutas de pago apagadas.
- Dependencias: revisar advisories, lockfile y scripts lifecycle; no ejecutar scripts upstream sin inspección.
- Entregar cambios en PR con pruebas, CI, riesgos, backup/rollback y evidencia. No afirmar pruebas no ejecutadas.

## 5. Reglas para agentes ecommerce/marketing/publicidad
- Preparar análisis, propuestas, copys, briefs, calendario, planes de experimentación y previsiones; no publicar ni ejecutar por defecto.
- No inventar precios, descuentos, garantías, clientes, casos de éxito, testimonios, características ni resultados.
- No activar campañas, anuncios, presupuestos, píxeles, cookies, audiencias, emails, formularios conectados a CRM ni outreach sin autorización específica.
- Cumplir las reglas de privacidad/consentimiento aplicables a la jurisdicción real del negocio. No asumir España/UE ni EE. UU. hasta verificar mercado, audiencia y entidad contratante.
- No usar listas scrapeadas, spam, dark patterns, reseñas falsas, urgencia engañosa ni claims no verificables.
- Medir con fuentes reales; separar datos observados de hipótesis y estimaciones. Definir baseline, atribución, guardrails y stop conditions.
- Copy por defecto en español neutro o el idioma definido por el mercado aprobado; no forzar localización sin confirmar público.
- Para Neotechzgz, optimizar funnels de servicios y suscripciones: captación, cualificación, propuesta, onboarding, retención y renovaciones. No inventar operaciones de inventario/envío/marketplace.

## 6. Flujo de trabajo obligatorio
1. Descubrir el contexto y los archivos actuales; no pedir datos ya documentados.
2. Resumir objetivo, restricciones, alcance y riesgos.
3. Proponer el cambio mínimo reversible.
4. Crear rama; editar; ejecutar lint, typecheck, tests y build pertinentes.
5. Revisar diff y posibles secretos/PII.
6. Abrir PR con evidencia, limitaciones y rollback.
7. Esperar aprobación para merge, despliegue, gastos, comunicación externa o cualquier cambio sensible.

## 7. Agentes de negocio incluidos
- E-commerce & Conversion Architect (custom Neotechzgz).
- Growth Hacker, SEO Specialist, Content Creator, Social Media Strategist, Email Strategist.
- PPC Campaign Strategist, Paid Social Strategist, Ad Creative Strategist, Tracking & Measurement Specialist.

Los perfiles upstream contienen recomendaciones genéricas que pueden no encajar con el modelo de Neotechzgz. Este playbook y `AGENTS.md` prevalecen.
