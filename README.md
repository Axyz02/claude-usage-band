# usage-band

Un mod para Claude Code que muestra, arriba de la barra del prompt, una línea con barras de uso:

```
ctx ████▍░░░░░  5h ██▎░░░░░░░ ↻2h15  7d ▉░░░░░░░░░ ↻4d3h  · ~$1.87 est.
```

- **ctx**: qué tan lleno está el contexto de la conversación.
- **5h / 7d**: uso de los límites de 5 horas y 7 días de la suscripción, con el tiempo hasta que se reinician (↻). Aparecen después de la primera respuesta de la sesión.
- **~$**: costo estimado de la sesión según `/cost`. Es una estimación, no lo que se cobra.

Las barras se ponen amarillas desde 70% y rojas desde 90%. Se actualizan solas después de cada respuesta.

## Instalación

En la terminal, dentro de una sesión de Claude Code:

```
/plugin install usage-band --marketplace Axyz02/claude-usage-band
```

Responde `y` para agregar el marketplace y elige el alcance (user, el primero, con Enter).

Desde una shell:

```
claude plugin install usage-band --marketplace Axyz02/claude-usage-band
```

## Uso

`/usage-band` muestra u oculta la barra. La elección se recuerda entre sesiones.
