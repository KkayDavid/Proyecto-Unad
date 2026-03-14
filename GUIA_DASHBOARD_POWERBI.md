# Guía rápida: Dashboard en Power BI con actualización en tiempo real + mapa regional

Esta guía te sirve para construir un dashboard que conecte una página/API con datos en tiempo real y un mapa regional donde al hacer clic en una región/estación veas su detalle actualizado.

## 1) Arquitectura recomendada (simple y escalable)

1. **Fuente de datos** (API web, base de datos, archivo en nube o stream).
2. **Power BI Desktop** para modelado inicial.
3. **Power BI Service** para publicar y actualizar.
4. **Actualización en tiempo real** por una de estas rutas:
   - **Streaming / Push dataset** (si tus datos llegan por eventos frecuentes).
   - **DirectQuery** (si tu BD soporta consulta directa).
   - **Import + Incremental Refresh + Programación** (si no es 100% streaming).

## 2) Conectar la página / API en Power BI

### Opción A: API REST (recomendada)
En Power BI Desktop:

- **Inicio > Obtener datos > Web**.
- Usa endpoint tipo: `https://tu-api.com/estaciones`.
- Si requiere token, configúralo en credenciales.

Ejemplo base en Power Query (M):

```powerquery
let
    Source = Json.Document(Web.Contents("https://tu-api.com/estaciones")),
    ToTable = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    Expand = Table.ExpandRecordColumn(ToTable, "Column1", {"id_estacion", "nombre", "region", "lat", "lon", "temperatura", "humedad", "fecha_hora"})
in
    Expand
```

### Opción B: Scraping de página web
- Solo si no existe API.
- En **Obtener datos > Web** puedes parsear tablas HTML, pero es menos estable.

## 3) Modelo de datos mínimo

Crea una tabla tipo `FactEstaciones` con columnas:

- `id_estacion`
- `nombre_estacion`
- `region`
- `latitud`
- `longitud`
- `timestamp`
- Métricas: `temperatura`, `humedad`, `pm25`, etc.

Y si puedes, una dimensión `DimRegion` para segmentar por zona.

## 4) Actualización en tiempo real

## Escenario 1: Streaming/Push Dataset
Ideal si tienes datos cada segundos/minutos.

1. En Power BI Service: **Workspace > Nuevo > Streaming dataset**.
2. Define campos (id estación, región, lat/lon, métricas, timestamp).
3. Inserta datos por API REST de Power BI.
4. Crea dashboard con tiles en tiempo real.

> Nota: para análisis más profundo conviene almacenar histórico (lake/DB) y combinar con informes normales.

## Escenario 2: DirectQuery
- Conecta a SQL/PostgreSQL/etc. en DirectQuery.
- Publica el reporte.
- Configura actualización automática de la página (Auto page refresh, según licencia/capacidad).

## Escenario 3: Import programado
- Si no necesitas segundos, programa refresh cada 5-15 min (según licencia).

## 5) Mapa regional con clic en estación

Visuales sugeridos:

- **Azure Maps** (nativo, recomendado)
- **Map** de Power BI
- **ArcGIS Maps for Power BI** (si necesitas capas avanzadas)

Configuración:

1. Inserta visual de mapa.
2. Asigna:
   - **Latitude** = `latitud`
   - **Longitude** = `longitud`
   - **Legend/Category** = `region`
   - **Size/Color** = métrica (ej. temperatura)
3. Activa interacciones entre visuales:
   - Al hacer clic en región/estación, que filtre tarjetas, tablas y series de tiempo.
4. Crea una tabla detalle por estación con:
   - última lectura,
   - hora,
   - estado (normal/alerta).

## 6) Medidas DAX útiles

```DAX
UltimaLectura = MAX(FactEstaciones[timestamp])

TempActual =
VAR _t = [UltimaLectura]
RETURN
CALCULATE(
    MAX(FactEstaciones[temperatura]),
    FactEstaciones[timestamp] = _t
)

HumedadActual =
VAR _t = [UltimaLectura]
RETURN
CALCULATE(
    MAX(FactEstaciones[humedad]),
    FactEstaciones[timestamp] = _t
)
```

## 7) Diseño recomendado del dashboard

- **Fila superior**: KPI cards (Temperatura actual, Humedad actual, # estaciones activas, Última actualización).
- **Centro izquierda**: mapa regional interactivo.
- **Centro derecha**: tabla detalle por estación.
- **Inferior**: tendencias de 24h/7d por estación seleccionada.
- **Panel lateral**: filtros por región, estación y rango horario.

## 8) Buenas prácticas para tiempo real

- Estandariza `timestamp` en UTC y convierte solo para visualización.
- Evita demasiados visuales pesados en una sola página.
- Usa agregaciones por minuto para históricos largos.
- Define reglas de calidad de datos (lat/lon nulos, duplicados, lecturas fuera de rango).

## 9) Qué necesito de ti para dejarlo armado

Para montarte una versión lista, compárteme:

1. URL de la página o endpoint API.
2. Ejemplo real del JSON/tabla.
3. Frecuencia de llegada de datos (cada cuántos segundos/minutos).
4. Regiones y estaciones (catálogo).
5. Métricas exactas a mostrar.
6. Si tienes Power BI Pro, PPU o capacidad Premium.

Con eso te puedo dar el diseño final (modelo + medidas + layout exacto) y una plantilla paso a paso para implementarlo sin errores.
