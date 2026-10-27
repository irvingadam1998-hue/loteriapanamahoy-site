#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/build-android-release.sh [path/to/android-project]
# Reuse this script for Android apps in this workspace to build with JDK 17.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
android_project="${1:-$repo_root/mobile/android}"
if [[ $# -gt 0 ]]; then
  shift
fi

if [[ ! -x "$android_project/gradlew" ]]; then
  echo "No encuentro gradlew ejecutable en: $android_project" >&2
  echo "Uso: $0 [ruta/al/proyecto/android]" >&2
  exit 2
fi

if [[ -z "${JAVA_HOME:-}" || ! -x "$JAVA_HOME/bin/java" ]] || \
   [[ "$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1)" != *'version "17'* ]]; then
  if [[ -x /usr/lib/jvm/java-17-openjdk/bin/java ]]; then
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
  elif [[ -x /usr/lib/jvm/java-17/bin/java ]]; then
    export JAVA_HOME=/usr/lib/jvm/java-17
  else
    echo "Se requiere JDK 17. Instálalo o define JAVA_HOME a una instalación de JDK 17." >&2
    exit 2
  fi
fi

export PATH="$JAVA_HOME/bin:$PATH"
echo "Compilando release con: $JAVA_HOME"
"$android_project/gradlew" -p "$android_project" assembleRelease "$@"
