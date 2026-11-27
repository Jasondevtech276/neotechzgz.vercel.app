# Gobernanza de migraciones Supabase

## Separación de entornos

- `supabase/migrations/`: migraciones candidatas para el proyecto canónico de producción. Cada cambio requiere revisión, prueba en el proyecto aislado y aprobación explícita antes de aplicar.
- `supabase/preview-migrations/`: migraciones exclusivas del proyecto de auditoría/Preview y de bases efímeras de CI. Nunca ejecutar estas migraciones contra el proyecto canónico.

Los workflows de CI pueden copiar ambas carpetas a una base PostgreSQL/Supabase desechable. Esa operación no autoriza a aplicar `preview-migrations` a un proyecto alojado.

## Estado de historial

La historia de migraciones aplicada en producción no coincide completamente con los prefijos de versión de algunos archivos del repositorio. Además, el proyecto aislado tiene su propia historia. Por tanto:

1. No ejecutar `supabase db push` ni `supabase migration up` contra producción hasta reconciliar cada versión y verificar el SQL ya aplicado.
2. No usar `--include-all` para forzar migraciones pendientes.
3. Probar primero en el proyecto aislado y consultar `pg_policies`, privilegios, constraints y triggers.
4. Aplicar cambios de producción individualmente, con una migración revisada y autorización explícita.
5. Registrar la versión realmente aplicada en Supabase y mantener el mapa de correspondencia por entorno.

## Datos y pagos

- Las tablas `payments`, `stripe_webhook_events` y `stripe_invoices` son ledgers de servidor; no conceder escritura a `anon` ni `authenticated`.
- `stripe_webhook_test_events` es exclusiva de pruebas, no debe existir en la ruta de migraciones de producción.
- Las pruebas de restauración deben usar una base PostgreSQL 17 desechable y nunca una cadena de conexión de producción como destino.

## Criterio de cierre

Una migración no se considera resuelta por compilar o pasar CI. Debe existir evidencia de aplicación en Preview, verificación de permisos y una restauración/rollback practicable cuando afecte datos.


## Versiones registradas tras la aplicación individual del 27-11-2026

| Entorno | Versión | Migración |
|---|---:|---|
| Preview aislado | 20261127135710 | secure_support_ticket_insert_columns |
| Preview aislado | 20261127140508 | consolidate_read_policies_final |
| Producción | 20261127142545 | secure_support_ticket_insert_columns |
| Producción | 20261127142557 | consolidate_read_policies_final |

Los ficheros se mantienen en sus carpetas por entorno con los prefijos realmente registrados. No reutilizar el prefijo de un entorno en otro. La historia anterior a estas migraciones sigue pendiente de reconciliación; no habilitar `db push` global.
