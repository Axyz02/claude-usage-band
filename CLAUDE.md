# claude-usage-band

Mod de Claude Code (plugin con hooks module) que dibuja una barra de uso sobre el prompt.

- `hooks/register.tsx`: el módulo. Lee `$.session.usage()` al iniciar y `session.measure` después; dibuja en `ui.render` `AbovePrompt`; `/usage-band` alterna la visibilidad (guardada en `$.store`).
- `types/index.d.ts`: contrato de `$.state` (sin imports; debe ser autocontenido).
- `.claude-plugin/marketplace.json`: hace del repo un marketplace instalable.

## Cómo probar
- `claude plugin validate .`
- Correr en desarrollo: `claude --plugin-dir .`
