# App Lenticelosis

Aplicacion web progresiva para evaluar lenticelosis en frutos de palta desde celular, con funcionamiento online y offline.

## Funciones principales

- Flujo guiado de 3 pasos antes de guardar cada fruto.
- Seleccion obligatoria de fecha, fundo, tipo de evaluacion, variedad y proceso.
- Registro de evaluaciones por fruto.
- Evaluacion de 3 cuadrantes por fruto, cada uno con marco visual 3x3.
- Captura de lenticelas totales y afectadas por cuadrante.
- Calculo automatico de lenticelas sanas, porcentaje de dano por cuadrante, promedio final y grado.
- Registro opcional de foto de la fruta desde camara o galeria.
- Guardado local en el dispositivo para trabajar sin internet.
- Almacenamiento de fotos en IndexedDB y datos de evaluacion en `localStorage`.
- Exportacion de resultados a CSV compatible con Excel.
- Instalacion como PWA mediante `manifest.json` y `service worker`.
- Interfaz responsiva pensada para uso en celular.

## Flujo por pasos

### Paso 1 de 3: Datos generales de la evaluacion

Antes de abrir el formulario de cuadrantes, la app solicita campos obligatorios:

- Fecha: campo tipo fecha, con la fecha actual por defecto.
- Fundo: Olmos o Motupe.
- Tipo de evaluacion: Mecanizada o Manual.
- Variedad: Hass, Zutano, Maluma, Pinkerton o Ettinger.

El usuario no puede avanzar si falta algun dato. Estos valores se muestran luego como resumen y se guardan con cada evaluacion.

### Paso 2 de 3: Proceso a elegir

Despues de completar los datos generales, se elige un proceso obligatorio:

1. 01. Planta
2. 02. Balde
3. 03. Bin
4. 04. Acopio
5. 05. Recepcion
6. 06. Proceso
7. 07. Desp. 5 dias
8. 08. Desp. 10 dias
9. 09. Desp. 15 dias
10. 10. Desp. 20 dias
11. 11. Desp. 25 dias

El formulario de evaluacion solo se muestra despues de seleccionar un proceso.

### Paso 3 de 3: Formulario de evaluacion

El formulario permite registrar:

- Codigo o N de fruto.
- Cuadrante 1.
- Cuadrante 2.
- Cuadrante 3.
- Resultado final.
- Clasificacion.
- Foto de la fruta.
- Observacion.
- Evaluaciones guardadas.

Como fecha y variedad se eligen en el Paso 1, ya no se piden dentro del formulario. En su lugar, el formulario muestra un resumen visible con:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Proceso.

Tambien incluye botones para volver, cambiar datos generales, cambiar proceso y comenzar una nueva evaluacion.

## Registro de cuadrantes

Por cada cuadrante se registra:

- Lenticelas totales.
- Lenticelas afectadas.
- Lenticelas sanas, calculadas automaticamente.
- Porcentaje de dano, calculado automaticamente.

## Regla de calculo

Por cuadrante:

```txt
porcentaje de dano = lenticelas afectadas / lenticelas totales * 100
```

Lenticelas sanas:

```txt
lenticelas sanas = lenticelas totales - lenticelas afectadas
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

## Foto de la fruta

En el formulario, despues del resultado final, aparece la seccion **Foto de la fruta**. Permite:

- Tomar foto desde la camara del celular.
- Subir una foto desde galeria.
- Ver la vista previa antes de guardar.
- Cambiar la foto seleccionando otra imagen.
- Eliminar la foto antes de guardar.
- Guardar la foto junto con la evaluacion para uso offline.

Las fotos se guardan localmente en IndexedDB para evitar sobrecargar `localStorage`. En las evaluaciones guardadas se muestra si existe foto y, al abrir **Ver cuadrantes**, se carga la foto guardada cuando esta disponible.

## Observacion

Despues de la foto hay un campo largo opcional llamado **Observacion** para notas de campo, condicion del fruto o comentarios.

## Datos guardados

Cada evaluacion guarda:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Proceso.
- Codigo o N de fruto.
- Datos del cuadrante 1.
- Datos del cuadrante 2.
- Datos del cuadrante 3.
- Resultado final.
- Clasificacion.
- Indicador de foto registrada.
- Foto de fruta, si existe.
- Observacion.

## Evaluaciones guardadas

Cada evaluacion se muestra de forma resumida con:

- Codigo o N de fruto.
- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Proceso.
- Resultado final.
- Clasificacion.
- Foto registrada: Si / No.

Al abrir **Ver cuadrantes** se muestran los datos de los 3 cuadrantes, la foto si existe y la observacion.

## Exportacion CSV

El CSV incluye:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Proceso.
- Codigo o N de fruto.
- Cuadrante 1: lenticelas totales, afectadas, sanas y porcentaje de dano.
- Cuadrante 2: lenticelas totales, afectadas, sanas y porcentaje de dano.
- Cuadrante 3: lenticelas totales, afectadas, sanas y porcentaje de dano.
- Resultado final.
- Clasificacion.
- Foto registrada: Si / No.
- Observacion.

El archivo descargado puede abrirse en Excel.

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

## Modo offline

La app usa un service worker para guardar la pantalla principal y recursos basicos despues de la primera visita. Las evaluaciones se guardan localmente en el navegador del dispositivo, por lo que pueden registrarse sin internet.

Las fotos se guardan en IndexedDB del mismo navegador. Al borrar datos del navegador o desinstalar la PWA, tambien pueden eliminarse las evaluaciones y fotos locales. Exporta CSV con frecuencia para respaldar los datos de campo.

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
