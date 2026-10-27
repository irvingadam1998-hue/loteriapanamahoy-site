# loteriapanamahoy.site

Web pública para consultar resultados de la Lotería de Panamá y comprobar billetes y chances. Los resultados se cargan desde el proyecto independiente `admin-unificado`; este repositorio no incluye panel de administración.

## Desarrollo local

Usa Node.js 20.9 o posterior. Ejecuta `npm run setup`, configura `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en `.env.local`, y luego `npm run dev`. También puedes usar `DATABASE_PROVIDER=sqlite` para desarrollar con una base local. Los ejemplos ficticios solo aparecen al establecer `DEMO_DATA=true`.

## Base de datos

Aplica las migraciones de `supabase/migrations` en orden. La migración `202610260001_draw_views.sql` añade un contador por sorteo y un registro de navegadores anónimos por sorteo. `202610260002_remove_embedded_admin.sql` retira las tablas de sesiones e intentos de acceso del antiguo panel. El contador se incrementa una sola vez por navegador y sorteo visible; los borradores y ejemplos no reciben vistas.

Para aplicar las dos migraciones nuevas, configura `SUPABASE_DB_URL` en `.env.local` con la conexión PostgreSQL del proyecto y ejecuta `node scripts/apply-public-migrations.mjs`. La URL permanece fuera de Git.

La web usa la clave de servidor de Supabase solo en el servidor. Nunca la coloques en una variable `NEXT_PUBLIC_`. Configura `DATABASE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `DEMO_DATA=false` y las URL públicas del dominio en el entorno de despliegue.

## Resultados e indexación

El sitio solo muestra sorteos publicados o programados. Los borradores no salen en las rutas públicas. Los resultados son orientativos: cualquier premio debe confirmarse con la Lotería Nacional de Beneficencia. `robots.txt` y `sitemap.xml` usan el dominio canónico configurado en `PUBLIC_SITE_URL`.
