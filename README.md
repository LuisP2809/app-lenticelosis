# App Lenticelosis

Aplicacion web progresiva para evaluar lenticelosis en frutos de palta desde celular, con funcionamiento online y offline.

## Funciones principales

- Flujo guiado de 3 pasos antes de guardar cada fruto.
- Seleccion obligatoria de fecha, fundo, tipo de evaluacion, variedad y proceso.
- Control independiente de frutos registrados por proceso.
- Codigo o N de fruto como lista obligatoria del 1 al 60.
- Validacion para evitar codigos repetidos dentro del mismo proceso.
- Lista de evaluaciones filtrada por el proceso actual.
- Boton **Guardar proceso** para marcar/finalizar el proceso actual.
- Seccion **Procesos guardados** para revisar procesos finalizados y sus frutos.
- Evaluacion de 3 cuadrantes por fruto, cada uno con marco visual 3x3.
- Calculo automatico de lenticelas sanas, porcentaje de dano por cuadrante, promedio final y grado.
- Registro opcional de foto de la fruta desde camara o galeria.
- Guardado local en el dispositivo para trabajar sin internet.
- Almacenamiento de fotos en IndexedDB y datos de evaluacion/procesos en `localStorage`.
- Exportacion de todos los procesos a CSV compatible con Excel.

## Flujo por pasos

### Paso 1 de 3: Datos generales de la evaluacion

Campos obligatorios:

- Fecha: campo tipo fecha, con la fecha actual por defecto.
- Fundo: Olmos o Motupe.
- Tipo de evaluacion: Mecanizada o Manual.
- Variedad: Hass, Zutano, Maluma, Pinkerton o Ettinger.

Estos valores se mantienen cuando se usa **Nueva evaluacion** para elegir otro proceso.

### Paso 2 de 3: Proceso a elegir

Cada proceso tiene sus propios frutos registrados y su propio estado:

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

### Paso 3 de 3: Formulario de evaluacion

Orden de la pantalla:

1. Resumen de fecha, fundo, tipo de evaluacion, variedad y proceso.
2. Codigo o N de fruto con lista del 1 al 60.
3. Cuadrantes 1, 2 y 3.
4. Resultado final y clasificacion.
5. Foto de fruta.
6. Observacion.
7. Boton para guardar evaluacion/fruto.
8. Evaluaciones guardadas del proceso actual.
9. Boton **Guardar proceso**.
10. Seccion **Procesos guardados**.

## Codigo o N de fruto

El codigo se elige desde una lista desplegable obligatoria con valores del 1 al 60.

Si un fruto ya fue registrado en el proceso actual, aparece marcado como **Registrado** y no puede seleccionarse. Ejemplo:

```txt
1 - Registrado
2 - Registrado
3 - Registrado
4
5
...
60
```

No se puede repetir el mismo codigo dentro del mismo grupo:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Proceso.

Cada proceso es independiente. El fruto `1` puede existir una vez en `02. Balde` y tambien una vez en `03. Bin`.

## Guardar proceso

El boton **Guardar proceso** marca el proceso actual como guardado/finalizado sin borrar sus evaluaciones.

Al guardar, la app muestra un mensaje como:

```txt
Proceso 02. Balde guardado correctamente.
```

Despues se puede usar **Nueva evaluacion** para volver al Paso 2, elegir otro proceso y registrar nuevos frutos manteniendo los datos generales del Paso 1.

## Procesos guardados

La seccion **Procesos guardados** muestra procesos finalizados con formato similar a:

```txt
02. Balde | 20 frutos | Guardado
03. Bin | 15 frutos | Guardado
04. Acopio | 10 frutos | Guardado
```

Al abrir un proceso guardado se pueden revisar sus evaluaciones, cuadrantes, observacion y foto si existe. Esta vista no borra ni modifica datos.

## Contadores

En **Evaluaciones guardadas** se muestra el contador del proceso actual:

```txt
Proceso actual 02. Balde: 20 frutos registrados de 60
40 pendientes
Proceso guardado
```

La lista de evaluaciones del Paso 3 muestra solo frutos del proceso actual. Los frutos de otros procesos siguen guardados y se pueden ver al seleccionar ese proceso o en **Procesos guardados** si fue finalizado.

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

La seccion **Foto de la fruta** permite:

- Tomar foto desde la camara del celular.
- Subir una foto desde galeria.
- Ver la vista previa antes de guardar.
- Cambiar la foto seleccionando otra imagen.
- Eliminar la foto antes de guardar.
- Guardar la foto junto con la evaluacion para uso offline.

Las fotos se guardan localmente en IndexedDB.

## Exportacion CSV

El CSV exporta todos los procesos, no solo el proceso actual. Incluye:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Proceso.
- Estado del proceso: En edicion / Guardado.
- Codigo o N de fruto.
- Datos de cuadrantes 1, 2 y 3.
- Resultado final.
- Clasificacion.
- Foto registrada: Si / No.
- Observacion.

## Modo offline

La app usa un service worker para guardar la pantalla principal y recursos basicos despues de la primera visita. Las evaluaciones, estados de procesos y fotos quedan en el navegador del dispositivo.

Al borrar datos del navegador o desinstalar la PWA, tambien pueden eliminarse las evaluaciones y fotos locales. Exporta CSV con frecuencia para respaldar los datos de campo.

## Instalacion local

Requisitos:

- Node.js 18 o superior.
- npm.

```bash
npm install
npm run dev
```

## Build de produccion

```bash
npm run build
npm run preview
```

El proyecto esta configurado con `base: './'` para facilitar publicaciones bajo una ruta como GitHub Pages.
