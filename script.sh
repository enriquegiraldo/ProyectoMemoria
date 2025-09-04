# ejecuta desde /home/enrique/ProyectoMemoria
for d in src/api-gateway src/frontend frontend src/microservices/auth-service src/microservices/payments-service src/microservices/media-service src/microservices/memories-service; do
  if [ -f "$d/package.json" ]; then
    if [ ! -f "$d/package-lock.json" ]; then
      echo "Generando package-lock.json en $d"
      (cd "$d" && npm install --package-lock-only) || { echo "Fallo en $d"; exit 1; }
    else
      echo "Ya existe $d/package-lock.json, saltando"
    fi
  else
    echo "No existe package.json en $d, saltando"
  fi
done