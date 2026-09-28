# Suerte Panamá

Web Next.js para publicar resultados manualmente y comprobar billetes y chances. Los premios y las reglas de cada sorteo los captura el administrador; la web no inventa resultados. La consulta es orientativa y el premio se confirma con la Lotería Nacional de Beneficencia.

## Ejecutar localmente

Usa Node.js 20.9 o posterior. Ejecuta `npm run setup` (crea `.env.local` con contraseña y secreto del administrador y deja Supabase como base predeterminada). Copia `SUPABASE_URL` y `SUPABASE_SECRET_KEY` desde tu proyecto Supabase a `.env.local`; usa una secret key `sb_secret_...` y no la compartas por chat. Inicia con `npm run dev` y abre `http://localhost:3015/admin`. La etiqueta del panel confirmará cuando conecte.

`DEMO_DATA=false` está activado de forma predeterminada, así que resultados y premios ficticios no aparecen. Puedes activar `DEMO_DATA=true` solo para una demostración local. En el panel se ve qué base está conectada.

## Base de datos gratis en Supabase y Vercel

Supabase ofrece un plan gratuito de PostgreSQL. En Supabase crea un proyecto, abre **SQL Editor** y ejecuta el contenido de `supabase/migrations/202609270001_lottery.sql`. Después, en **Project Settings → API Keys**, copia el Project URL y crea una **Secret key** `sb_secret_...` para el servidor. Nunca uses la secret key en el navegador ni una variable `NEXT_PUBLIC_`.

Configura estas variables en **Vercel → Project → Settings → Environment Variables** para Production (y Preview si corresponde):

- `DATABASE_PROVIDER=supabase`
- `SUPABASE_URL` (Project URL de Supabase)
- `SUPABASE_SECRET_KEY` (secret key de servidor)
- `ADMIN_PASSWORD` (contraseña nueva y única)
- `SESSION_SECRET` (secreto aleatorio de al menos 32 caracteres)
- `DEMO_DATA=false`
- `NEXT_PUBLIC_SITE_URL` y `APP_ORIGIN` (dominio de tu web con `https://`)
- `COOKIE_SECURE=true`

Redespliega desde Vercel. El panel `/admin` verifica la conexión; una etiqueta verde confirma que Supabase está disponible. Los sorteos publicados quedan guardados en PostgreSQL y se comparten en todos los dispositivos. Si faltan las credenciales o la migración, el panel presenta el motivo y Vercel no escribe en SQLite efímero.

## Indexación en buscadores

Define `NEXT_PUBLIC_SITE_URL` y `APP_ORIGIN` con el dominio público definitivo y HTTPS. En Vercel, producción permite indexación; las vistas Preview y los entornos con `DEMO_DATA=true` quedan fuera de Google. En alojamiento propio, añade `PUBLIC_INDEXING_ENABLED=true` para habilitarla. La web genera canonical por página, `robots.txt` y `sitemap.xml`; el sitemap incluye únicamente resultados publicados que no sean de demostración. Después del despliegue, registra `https://tu-dominio/sitemap.xml` en Google Search Console.

## Publicar resultados

Inicia sesión en `/admin`, pulsa **Nuevo sorteo**, introduce fecha, número, primeros premios y referencia oficial. Configura los premios de billete y chance en el plan; márcalo verificado solo después de cotejarlo con las reglas oficiales. Un sorteo se puede guardar como borrador antes de publicarlo. El comprobador evita afirmar que no hubo premio si falta verificar el plan.

## Anuncios

Configura `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_TOP_SLOT`, `NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT` y `NEXT_PUBLIC_ADSENSE_BOTTOM_SLOT` con una cuenta y espacios aprobados. Sin identificadores, los espacios quedan vacíos.

Para que **local y Vercel compartan los mismos sorteos**, aplica la migración una sola vez en el Supabase del proyecto y usa el mismo `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en ambos entornos. En local, `npm run setup` crea `.env.local`; completa ahí esas dos variables y reinicia `npm run dev`. El archivo local está excluido de Git. Las pruebas automáticas usan SQLite en archivos temporales aislados; la aplicación normal elige Supabase.
