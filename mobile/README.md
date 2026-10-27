# Lotería Panamá para Android (React Native CLI)

La app usa React Native CLI, sin Expo. Descarga los sorteos publicados y envía
el número a la API pública del sitio. La clave de Supabase permanece en el
servidor y nunca se incluye en la aplicación.

## Preparar el entorno

- Node.js 20.19.4 o superior.
- Android Studio con Android SDK 36 y un teléfono con depuración USB o un emulador.
- JDK 17 para compilar Android.

Desde esta carpeta (`mobile`):

```bash
npm install
npm run typecheck
npm run start
```

En otra terminal, compila e instala la app:

```bash
npm run android
```

Para crear el APK de depuración sin instalarlo:

```bash
npm run android:apk
```

Este APK está limitado a ARM64 para reducir el tiempo de compilación y el
tamaño. La variante de depuración necesita Metro activo para cargar JavaScript;
para probarla, deja `npm run start` ejecutándose y después instala con
`npm run android`.

## Servidor de resultados

La URL pública se configura en `App.tsx`, en `API_BASE_URL`. Por defecto apunta
a `https://loteriapanamahoy.site`. Para desarrollo local, cambia temporalmente
esa constante por la dirección LAN de tu computadora y el puerto `3015` (por
ejemplo `http://192.168.1.20:3015`); el teléfono y la computadora deben estar
en la misma Wi-Fi.

El historial permite filtrar por sorteo, fecha y número. También se pueden
compartir resultados y activar avisos; Android consulta resultados nuevos en
segundo plano, con intervalos de hasta 15 minutos según la conexión y el ahorro
de batería.

## Lector del billete

La cámara usa VisionCamera y el reconocimiento de texto de Google ML Kit se
ejecuta en el teléfono. La imagen no se envía a la web y el lector no depende
del QR ni del código de barras. La app propone las cifras que detecta para que
el usuario elija y las confirme antes de consultar el resultado.

La lectura puede variar con el enfoque, reflejos, iluminación, desgaste y el
diseño del boleto. Revisa siempre las cifras sugeridas; si no aparecen, vuelve
a tomar la foto o escríbelas manualmente.
