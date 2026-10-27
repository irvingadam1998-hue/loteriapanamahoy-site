import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env.local")) {
  console.log(".env.local ya existe. Se conserva tu configuración.");
} else {
  writeFileSync(
    ".env.local",
    `DATABASE_PROVIDER=supabase\nSUPABASE_URL=\nSUPABASE_SECRET_KEY=\nDEMO_DATA=false\nNEXT_PUBLIC_SITE_URL=http://localhost:3015\n`,
    { mode: 0o600 },
  );
  console.log(
    "Configuración local creada. Añade la URL y la clave de servidor de Supabase en .env.local.",
  );
}
