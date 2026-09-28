import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env.local")) {
  console.log(".env.local ya existe. Se conserva tu configuración.");
} else {
  const password = randomBytes(18).toString("base64url");
  writeFileSync(
    ".env.local",
    `ADMIN_PASSWORD=${password}\nSESSION_SECRET=${randomBytes(48).toString("hex")}\nDATABASE_PROVIDER=supabase\nSUPABASE_URL=\nSUPABASE_SECRET_KEY=\nDEMO_DATA=false\nCOOKIE_SECURE=false\nNEXT_PUBLIC_SITE_URL=http://localhost:3015\nAPP_ORIGIN=http://localhost:3015\n`,
    { mode: 0o600 },
  );
  console.log(
    "Configuración local creada. Añade SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local. La clave del panel está en ADMIN_PASSWORD.",
  );
}
