# Dashboard ThingSpeak en tiempo real

Aplicación web estática para visualizar datos de un canal de ThingSpeak en tiempo real.

## Canal preconfigurado

El dashboard arranca automáticamente usando este canal público:

- https://thingspeak.mathworks.com/channels/3269359

También puedes reemplazarlo por otro canal ingresando:
- solo el número del canal (ej: `123456`), o
- la URL completa del canal (ej: `https://thingspeak.mathworks.com/channels/123456`).

## Cómo usar

1. Abre `index.html` en tu navegador (o levanta un servidor local).
2. Verifica/ajusta el **Channel ID o URL del canal**.
3. Si el canal es privado, agrega tu **Read API Key**.
4. Configura el número de muestras y el intervalo de actualización.
5. Pulsa **Conectar** (o deja la carga automática por defecto).

El dashboard mostrará:
- Tarjetas con el último valor de cada campo configurado en el canal.
- Una gráfica histórica por cada campo.
- Actualización automática según el intervalo elegido.

## Ejecutar con servidor local

```bash
python3 -m http.server 8000
```

Luego abre: `http://localhost:8000`.
