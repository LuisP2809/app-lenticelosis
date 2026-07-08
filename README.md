# App Lenticelosis

Aplicacion web progresiva para evaluar lenticelosis en frutos de palta desde celular, con funcionamiento online y offline.

## Conceptos principales

### Evaluacion general

Una evaluacion general agrupa el trabajo de campo por:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.

Dentro de una evaluacion general se pueden registrar varios procesos y los frutos de cada proceso.

### Proceso

Un proceso es una etapa de evaluacion dentro de una evaluacion general. Opciones disponibles:

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

### Fruto

Cada fruto pertenece a un proceso especifico y contiene:

- Codigo o N de fruto del 1 al 60.
- Datos de los 3 cuadrantes.
- Resultado final.
- Clasificacion.
- Foto opcional.
- Observacion.

## Funciones principales

- Flujo guiado de 3 pasos.
- Registro de evaluaciones generales guardadas.
- Continuacion de evaluaciones generales anteriores.
- Pantalla principal sin Fundo, Tipo de evaluacion ni Variedad seleccionados por defecto para una nueva evaluacion.
- Aviso para abrir la app una vez con conexion y activar el modo offline.
- Indicador visual automatico de **Modo online** y **Modo offline**.
- Exportacion CSV desde la pantalla principal y desde el Paso 3.
- Limpieza total protegida con confirmacion y contraseña.
- Control independiente de frutos registrados por proceso.
- Codigo o N de fruto como lista obligatoria del 1 al 60.
- Validacion para evitar codigos repetidos dentro del mismo proceso.
- Lista de frutos filtrada por el proceso actual.
- Boton **Guardar proceso** para marcar/finalizar el proceso actual.
- Seccion **Procesos guardados** para revisar procesos de la evaluacion general actual.
- Evaluacion de 3 cuadrantes por fruto, cada uno con marco visual 3x3.
- Calculo automatico de lenticelas sanas, porcentaje de dano por cuadrante, promedio final y grado.
- Registro opcional de foto de la fruta desde camara o galeria.
- Guardado local en el dispositivo para trabajar sin internet.
- Almacenamiento de fotos en IndexedDB y datos de evaluacion/procesos en `localStorage`.
- Exportacion de todas las evaluaciones generales, procesos y frutos a CSV compatible con Excel.

## Flujo por pasos

### Paso 1 de 3: Datos generales de la evaluacion

Campos obligatorios:

- Fecha: campo tipo fecha, con la fecha actual por defecto.
- Fundo: Olmos o Motupe.
- Tipo de evaluacion: Mecanizada o Manual.
- Variedad: Hass, Zutano, Maluma, Pinkerton o Ettinger.

Cuando se entra a la pantalla principal para iniciar una evaluacion nueva, Fundo, Tipo de evaluacion y Variedad aparecen sin seleccion marcada, aunque existan evaluaciones guardadas. Solo se cargan selecciones anteriores cuando se usa explicitamente **Continuar evaluacion**.

Acciones disponibles:

- **Iniciar evaluacion**: pasa al Paso 2 usando los datos generales seleccionados.
- **Exportar CSV**: descarga todo el historial guardado.
- **Limpiar todo**: elimina todas las evaluaciones, procesos, frutos y fotos locales despues de confirmar y escribir la contraseña.
- **Ver detalle**: abre una evaluacion guardada y muestra datos generales, procesos y frutos.
- **Continuar evaluacion**: carga los datos generales de una evaluacion guardada y lleva al Paso 2.

La seccion **Evaluaciones guardadas** muestra tarjetas con fecha, fundo, tipo, variedad, cantidad de procesos y total de frutos registrados.

### Paso 2 de 3: Seleccion de proceso

Permite elegir un proceso dentro de la evaluacion general actual. Si se continua una evaluacion guardada, se mantienen fecha, fundo, tipo y variedad para agregar un nuevo proceso o continuar uno existente.

### Paso 3 de 3: Formulario de frutos del proceso

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
10. Seccion **Procesos guardados** de la evaluacion general actual.

El boton **Nuevo proceso** vuelve al Paso 2 y mantiene los datos generales actuales. No borra procesos, frutos ni fotos guardadas.

El boton **Volver** muestra la advertencia:

```txt
¿Seguro que quieres salir? Recomendamos guardar el proceso antes de salir.
```

Si se cancela, la app permanece en el Paso 3. Si se confirma la salida, vuelve al Paso 1 sin borrar la evaluacion general, procesos, frutos ni fotos. La pantalla principal queda lista para una nueva evaluacion, sin Fundo, Tipo de evaluacion ni Variedad seleccionados.

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

Reglas:

- No se puede repetir el mismo codigo dentro del mismo proceso de la misma evaluacion general.
- Si se puede repetir el mismo codigo en otro proceso.
- Si se puede repetir el mismo codigo en otra evaluacion general diferente.

Ejemplos:

```txt
Evaluacion A / Proceso 02. Balde / Fruto 1 = permitido una sola vez
Evaluacion A / Proceso 03. Bin / Fruto 1 = permitido
Evaluacion B / Proceso 02. Balde / Fruto 1 = permitido
```

## Guardar proceso

El boton **Guardar proceso** marca el proceso actual como guardado/finalizado sin borrar sus evaluaciones.

Al guardar, la app muestra un mensaje como:

```txt
Proceso 02. Balde guardado correctamente.
```

Despues se puede usar **Nuevo proceso** para volver al Paso 2, elegir otro proceso y registrar nuevos frutos manteniendo los datos generales del Paso 1.

## Evaluaciones guardadas

En el Paso 1, cada evaluacion guardada muestra:

- Fecha.
- Fundo.
- Tipo de evaluacion.
- Variedad.
- Cantidad de procesos registrados.
- Cantidad total de frutos registrados.

Con **Ver detalle** se muestran los datos generales, procesos registrados y frutos de cada proceso. Al abrir un proceso se pueden revisar codigo de fruto, resultado final, clasificacion, foto registrada, cuadrantes, observacion y foto si existe.

Con **Continuar evaluacion** se cargan sus datos generales y se vuelve al Paso 2 para elegir un proceso.

## Limpiar todo

El boton **Limpiar todo** esta en la pantalla principal. Para borrar datos se requiere doble validacion:

1. Confirmar el mensaje:

```txt
¿Seguro quieres limpiar todo? Se eliminarán todas las evaluaciones.
```

2. Ingresar la contraseña actual:

```txt
2026
```

Si la contraseña es incorrecta, la app muestra:

```txt
Contraseña incorrecta
```

Si la contraseña es correcta, se eliminan evaluaciones generales, procesos, frutos, fotos de IndexedDB y datos locales relacionados. La pantalla principal vuelve al estado inicial y muestra:

```txt
Todas las evaluaciones fueron eliminadas.
```

## Procesos guardados

La seccion **Procesos guardados** del Paso 3 muestra procesos finalizados de la evaluacion general actual con formato similar a:

```txt
02. Balde | 20 frutos | Guardado
03. Bin | 15 frutos | Guardado
04. Acopio | 10 frutos | Guardado
```

Al abrir un proceso guardado se pueden revisar sus evaluaciones, cuadrantes, observacion y foto si existe. Esta vista no borra ni modifica datos.

## Contadores

En **Evaluaciones guardadas** del Paso 3 se muestra el contador del proceso actual:

```txt
Proceso actual 02. Balde: 20 frutos registrados de 60
40 pendientes
Proceso guardado
```

La lista del Paso 3 muestra solo frutos del proceso actual. Los frutos de otros procesos siguen guardados y se pueden ver en **Procesos guardados** o desde el detalle de la evaluacion general en el Paso 1.

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

El boton **Exportar CSV** de la pantalla principal exporta todas las evaluaciones generales guardadas, todos sus procesos y todos sus frutos. El boton de exportacion del Paso 3 usa el mismo historial completo.

El archivo incluye:

- ID de evaluacion general.
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

La app muestra este aviso al abrir:

```txt
Para usar la app sin internet, primero abre la aplicación una vez con conexión para activar el modo offline.
```

La app usa un service worker para guardar la pantalla principal y recursos basicos despues de la primera visita con conexion. El indicador visual cambia automaticamente entre **Modo online** y **Modo offline** segun la conexion del celular.

Las evaluaciones, estados de procesos y fotos quedan en el navegador del dispositivo.

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
