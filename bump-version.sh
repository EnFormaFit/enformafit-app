#!/bin/bash
# ─────────────────────────────────────────────────────────────
# bump-version.sh
# Actualiza el BUILD en todos los archivos de una vez.
# Uso: ./bump-version.sh
# ─────────────────────────────────────────────────────────────

NEW_VER=$(date +%s)
echo "Nuevo BUILD: $NEW_VER"

APP_INDEX=/home/claude/enformafit-app/index.html
PANEL_INDEX=/home/claude/enformafit-panel/index.html
BACKEND=/home/claude/enformafit-app/backend/server.js

# app/index.html - build comment y BUILD en script inline
sed -i "s/<!-- build [0-9]* -->/<!-- build $NEW_VER -->/" $APP_INDEX
sed -i "s/var BUILD='[0-9]*'/var BUILD='$NEW_VER'/" $APP_INDEX

# panel/index.html - BUILD en script inline
sed -i "s/var BUILD='[0-9]*'/var BUILD='$NEW_VER'/" $PANEL_INDEX

# backend/server.js - BUILD_VERSION fallback hardcoded
sed -i "s/|| '[0-9]*'/|| '$NEW_VER'/" $BACKEND

echo ""
echo "VERSION $NEW_VER actualizada en:"
echo "  - enformafit-app/index.html"
echo "  - enformafit-panel/index.html"
echo "  - enformafit-app/backend/server.js"
echo ""
echo "Recuerda actualizar tambien los ?v= de los JS modificados:"
echo "  sed -i \"s/app-core9.js?v=[0-9]*/app-core9.js?v=$NEW_VER/\" $APP_INDEX"
echo "  sed -i \"s/panel-core7.js?v=[0-9]*/panel-core7.js?v=$NEW_VER/\" $PANEL_INDEX"
