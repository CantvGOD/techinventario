#!/bin/bash
# Script de inicio rápido de TechInventario - Sistema Web Telecom

echo "====================================================="
echo " 📱 TechInventario - Sistema Web Telecom"
echo "====================================================="
echo ""

CDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$CDIR"

# 1. Comprobar e iniciar servicio MariaDB/MySQL si es necesario
echo "📦 Verificando base de datos..."
if ! mysql -u root -e "USE techinventario_db;" 2>/dev/null; then
    echo "📦 Inicializando base de datos local..."
    mysql -u root < "$CDIR/database.sql" 2>/dev/null || sudo mariadb -u root < "$CDIR/database.sql" 2>/dev/null
fi

# 2. Iniciar Backend API en segundo plano
echo "🚀 Iniciando servidor backend..."
pkill -f "node.*server.cjs" 2>/dev/null || true
node "$CDIR/server.cjs" >/dev/null 2>&1 &

# 3. Abrir navegador en la aplicación web
if command -v xdg-open > /dev/null; then
    (sleep 1.5 && xdg-open http://localhost:5173/) &
fi

# 4. Iniciar Frontend React
echo "🌐 Iniciando aplicación en http://localhost:5173/ ..."
npm run dev
