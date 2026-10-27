# Generar APK de release

Esta guía genera el APK Android de loteriapanamahoy.site desde `mobile/`.

## Requisitos

- Node.js 20.19.4 o superior.
- JDK 17.
- Android SDK 36 y las herramientas de compilación correspondientes.
- Dependencias instaladas (`npm install` dentro de `mobile/`).

## Compilar

Abre una terminal en la carpeta `mobile` y ejecuta:

```bash
npm install
npm run android:release
```

El comando usa el script compartido `scripts/build-android-release.sh`, que
selecciona JDK 17 aunque el JDK predeterminado del sistema sea otro. Para
reutilizar la misma configuración con otra app Android de este espacio de
trabajo, pásale la ruta a su carpeta `android` desde la raíz del repositorio:

```bash
./scripts/build-android-release.sh ruta/a/otra-app/android
```

También puedes ejecutar el script desde la raíz para compilar esta app:

```bash
./scripts/build-android-release.sh
```

En Linux/macOS, el APK se crea en:

```text
mobile/android/app/build/outputs/apk/release/app-release.apk
```

La variante release incluye el bundle JavaScript dentro del APK; no hace falta
dejar Metro ejecutándose. Para instalarlo en un teléfono conectado con depuración
USB activada:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Si ejecutas `adb` desde la raíz del proyecto, usa esta ruta:

```bash
adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Firma del APK

La configuración actual de `android/app/build.gradle` firma `release` con la
clave de depuración incluida en el proyecto. Sirve para instalar y compartir
una compilación de prueba, pero no para publicar en Google Play ni para mantener
una identidad de firma de producción.

Para publicar, crea y guarda una clave privada propia en un lugar seguro, y
configura `signingConfigs.release` en `android/app/build.gradle` para leer el
keystore y sus contraseñas desde variables de entorno o un archivo local que no
se suba al repositorio. Luego asigna esa configuración al bloque `release` y
vuelve a ejecutar `./gradlew assembleRelease`. Conserva una copia de seguridad
del keystore: las futuras actualizaciones deben firmarse con la misma clave.

## Arquitectura

El proyecto está configurado para compilar `arm64-v8a` en
`android/gradle.properties`, lo que reduce el tamaño del APK. El archivo está
destinado a teléfonos Android ARM64; para incluir otras arquitecturas, cambia
`reactNativeArchitectures` y vuelve a compilar.
