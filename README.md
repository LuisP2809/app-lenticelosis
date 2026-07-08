# App Lenticelosis

Aplicacion web progresiva para evaluar lenticelosis en frutos de palta desde celular, con funcionamiento online y offline.

## Funciones principales

- Flujo guiado por pasos antes de registrar frutos.
- Seleccion obligatoria de fundo, tipo de evaluacion y proceso.
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

### Paso 1: Seleccion inicial

Antes de abrir el formulario, la app solicita dos campos obligatorios:

- Fundo: Olmos o Motupe.
- Tipo de evaluacion / cosecha: Mecanica o Manual.

La pantalla usa botones grandes para facilitar el uso desde celular. El usuario no puede avanzar hasta seleccionar ambos campos.

### Paso 2: Seleccion de proceso

Luego se elige el proceso obligatorio:

1. 01. Planta
2. 02. Balde
3. 03. Bin
4. 04. Acopio
5. 05. Recepcion
6. 06. Desp. Proceso
7. 07. Desp. 5 dias
8. 08. Desp. 10 dias
9. 09. Desp. 15 dias
10. 10. Desp. 20 dias
11. 11. Desp. 25 dias

El formulario de evaluacion solo se muestra despues de seleccionar un proceso.

### Paso 3: Formulario de evaluacion

El formulario mantiene la pantalla original de registro e incorpora un resumen superior con:

- Fundo.
- Tipo de evaluacion.
- Proceso.

Tambien incluye botones para volver, cambiar la seleccion inicial y comenzar una nueva evaluacion.

## Foto de la fruta

En el formulario, despues del resultado final, aparece la seccion **Foto de la fruta**. Permite:

- Tomar foto desde la camara del celular.
- Subir una foto desde galeria.
- Ver la vista previa antes de guardar.
- Cambiar la foto seleccionando otra imagen.
- Eliminar la foto antes de guardar.
- Guardar la foto junto con la evaluacion para uso offline.

Las fotos se guardan localmente en IndexedDB para evitar sobrecargar `localStorage`.

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

## Datos guardados

Cada evaluacion guarda:

- Fundo.
- Tipo de evaluacion.
- Proceso.
- Codigo del fruto.
- Variedad.
- Lote / muestra.
- Fecha.
- Datos de los 3 cuadrantes.
- Resultado final.
- Grado de clasificacion.
- Indicador de foto registrada.
- Foto de fruta, si existe.
- Observaciones.

## Exportacion CSV

El CSV incluye las columnas anteriores y agrega:

- Fundo.
- Tipo de evaluacion.
- Proceso.
- Foto registrada: Si / No.
- Observaciones.

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
