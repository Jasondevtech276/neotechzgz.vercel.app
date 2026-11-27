# Copias externas cifradas de Supabase en R2 EU

## Estado

- Workflow manual en PR; no tiene programación diaria hasta validar la primera copia y la restauración.
- Proyecto fuente: Supabase canónico `qkzmpxyefuqdhyxwfjcw`, PostgreSQL 17, región London (UK).
- Bucket actual `neotechzgz-db-backups`: WEUR, jurisdicción `default`, vacío. No usarlo para datos personales si se exige residencia garantizada en la UE.
- El nuevo destino debe ser `neotechzgz-db-backups-eu`, jurisdicción `eu`. No se ha creado ni se han subido datos.

## Crear el destino EU

En Cloudflare Dashboard:

1. Abrir **R2 Object Storage → Overview → Create bucket**.
2. Nombre: `neotechzgz-db-backups-eu`.
3. En **Location**, seleccionar **Specify jurisdiction → EU**.
4. Mantener el bucket privado. No habilitar `r2.dev` ni un dominio público.
5. Crear un token S3 API con Object Read & Write limitado exclusivamente a ese bucket.
6. Copiar el Access Key ID y Secret Access Key directamente a GitHub Actions Secrets; nunca a Git, issues o chat.

El endpoint debe ser `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com`. El subdominio `.eu.` es obligatorio: Cloudflare documenta que los endpoints jurisdiccionales no acceden a buckets de otras jurisdicciones. La jurisdicción no puede cambiarse después de crear el bucket.

## GitHub Actions Variables

En **Settings → Secrets and variables → Actions → Variables**:

| Variable | Valor |
|---|---|
| `SUPABASE_DB_HOST` | Host del Session Pooler del proyecto canónico |
| `SUPABASE_DB_USER` | Usuario del Session Pooler que incluye el project ref `qkzmpxyefuqdhyxwfjcw` |
| `S3_ENDPOINT` | `https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com` |
| `S3_REGION` | `auto` |
| `S3_BUCKET` | `neotechzgz-db-backups-eu` |

## GitHub Actions Secrets

En **Settings → Secrets and variables → Actions → Secrets**:

| Secret | Contenido |
|---|---|
| `SUPABASE_DB_PASSWORD` | Contraseña de base de datos del proyecto canónico |
| `S3_ACCESS_KEY_ID` | Access Key ID del token S3 limitado al bucket EU |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key del mismo token |
| `RESTIC_PASSWORD` | Contraseña única y de alta entropía del repositorio Restic |

No introducir estos valores en chat, commits, logs o variables públicas.

## Ejecución manual

1. Confirmar que el bucket se creó con jurisdicción `eu`.
2. Configurar las variables y secretos anteriores.
3. Abrir **Actions → Supabase EU R2 encrypted off-site backup → Run workflow**.
4. Escribir exactamente `BACKUP_TO_EU_R2`.
5. Revisar que el workflow confirma PostgreSQL 17, crea el dump, inicializa Restic solo si el bucket está vacío, crea un snapshot con tag del proyecto y completa `restic check`.
6. No activar un schedule diario hasta que la copia manual y una restauración aislada hayan sido verificadas.

La política Restic conserva 7 copias diarias y 4 semanales. El dump temporal se crea con permisos restrictivos y se elimina al finalizar incluso si el workflow falla. El repositorio Restic cifra los datos antes de subirlos.

## Restauración y alcance

La copia R2 aún no tiene una restauración completa demostrada. PR #57 contiene un workflow manual separado de dump/restore PostgreSQL 17 a destino desechable, pero no restaura desde R2; no confundir ambas pruebas. La siguiente mejora debe restaurar un snapshot Restic en una instancia PostgreSQL/Supabase compatible y aislada, validar extensiones, roles, RLS, triggers y ejecutar pruebas de aplicación.

El dump PostgreSQL no incluye los objetos binarios de Supabase Storage, secretos, configuración Auth, Edge Functions, DNS ni variables Vercel. Esos elementos requieren procedimientos de backup separados.

## Consideración de transferencias internacionales

El bucket EU garantiza que los objetos R2 se almacenen y procesen dentro de la jurisdicción UE. Sin embargo, este workflow utiliza GitHub-hosted runners; GitHub no garantiza que el procesamiento temporal del dump ocurra exclusivamente en la UE. Antes de usar datos reales, revisar el DPA y el mecanismo de transferencia aplicable de GitHub. Si se exige procesamiento exclusivamente UE, usar un runner propio en infraestructura UE y revisar su coste/operación.

Supabase producción está en London (UK), no en un Estado miembro de la UE. La decisión de adecuación UK puede cubrir transferencias bajo RGPD, pero no convierte la región en residencia física UE. El origen, runner y destino deben documentarse por separado.

## Límites

- Supabase Free no ofrece backups automáticos descargables; este flujo es un control externo.
- R2 tiene cuotas gratuitas y posibles cargos al superarlas; monitorizar almacenamiento y operaciones.
- El workflow está solo en `workflow_dispatch` hasta que exista una primera copia verificada y una restauración real.
- No ejecutar `supabase db push` ni usar la copia como prueba de recuperación hasta completar el restore aislado.
