# App Lenticelosis

Aplicacion web progresiva para evaluar lenticelosis en frutos de palta desde celular, con funcionamiento online y offline.

## Funciones principales

- Registro de evaluaciones por fruto.
- Evaluacion de 3 cuadrantes por fruto, cada uno con marco visual 3x3.
- Captura de lenticelas totales y afectadas por cuadrante.
- Calculo automatico de lenticelas sanas, porcentaje de dano por cuadrante, promedio final y grado.
- Guardado local en el dispositivo con `localStorage`, util cuando no hay internet.
- Exportacion de resultados a CSV compatible con Excel.
- Instalacion como PWA mediante `manifest.json` y `service worker`.
- Interfaz responsiva pensada para uso en celular.

## Regla de calculo

Por cuadrante:

```txt
porcentaje de dano = lenticelas afectadas / lenticelas totales * 100
```

Resultado final del fruto:

```txt
promedio de los porcentajes de dano de los 3 cuadrantes
```

Clasificacion:

| Grado | Porcentaje de dano final |
| --- | --- |
| Grado 0 | 0% |
| Grado 1 | 1% a 10% |
| Grado 2 | Mayor a 10% hasta 20% |
| Grado 3 | Mayor a 20% hasta 30% |
| Grado 4 | Mayor a 30% hasta 40% |
| Grado 5 | Mayor a 40% hasta 50% |
| Grado 6 | Mayor a 50% |

## Instalacion local

Requisitos:

- Node.js 18 o superior.
- npm.

Pasos:

```bash
npm install
npm run dev
```

Luego abre la URL que muestra la terminal. Para probarla desde un celular, conecta el celular a la misma red Wi-Fi y abre la URL de red que entrega Vite.

## Uso

1. Completa codigo del fruto, variedad, lote y fecha.
2. Para cada uno de los 3 cuadrantes, registra lenticelas totales y lenticelas afectadas.
3. La app calcula automaticamente lenticelas sanas y porcentaje de dano.
4. Revisa el resultado final y el grado de clasificacion.
5. Presiona **Guardar evaluacion**.
6. Usa **Exportar CSV** para descargar un archivo que puede abrirse en Excel.

## Modo offline

La app usa un service worker para guardar la pantalla principal y recursos basicos despues de la primera visita. Las evaluaciones se guardan localmente en el navegador del dispositivo, por lo que pueden registrarse sin internet.

Importante: al borrar datos del navegador o desinstalar la PWA, tambien pueden eliminarse las evaluaciones locales. Exporta CSV con frecuencia para respaldar datos de campo.

## Build de produccion

```bash
npm run build
npm run preview
```

El proyecto esta configurado con `base: './'` para facilitar publicaciones bajo una ruta como GitHub Pages.

## Estructura

```txt
.
├── index.html
├── manifest.json
├── package.json
├── public/
│   ├── icon.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── main.js
│   └── styles.css
├── sw.js
└── vite.config.js
```
