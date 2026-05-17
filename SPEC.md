# VSArcade — Especificación Técnica y Arquitectura

> **Versión:** 1.0  
> **Fecha:** 2026-05-09  
> **Estado:** Blueprint listo para implementación  
> **Autor:** monosen

---

## 1. Overview

**VSArcade** es una extensión para Visual Studio Code que embebe juegos clásicos estilo Game Boy dentro del editor de código. La extensión se presenta como una pestaña en la Activity Bar (sidebar izquierda), permitiendo al usuario jugar o visualizar juegos sin salir del entorno de trabajo.

El juego piloto es **Tetris** (basado en la versión Game Boy de 1989), con mecánicas clásicas, visual con color, y un modo automático/infinito para uso pasivo.

**Objetivo:** Ofrecer micro-descansos visuales y lúdicos integrados nativamente en VS Code.

---

## 2. Requisitos Funcionales

### 2.1 Core

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| R01 | La extensión debe registrar una vista propia en la Activity Bar (icono de pestaña). | Alta |
| R02 | Al hacer click en el icono, se debe abrir un webview en el sidebar. | Alta |
| R03 | El juego debe ser seleccionable vía Command Palette: `VSArcade: Select Game`. | Alta |
| R04 | El juego debe ser jugable con el teclado (flechas, rotación, pausa). | Alta |
| R05 | Debe existir un modo Automático/Infinito donde el juego se ejecuta solo sin intervención del usuario. | Alta |
| R06 | El juego debe mostrar el score actual. | Alta |
| R07 | El juego debe permitir pausar y reanudar. | Alta |
| R08 | Debe existir una opción para expandir el juego a pantalla completa dentro de VS Code (panel central). | Media |
| R09 | El sistema debe permitir agregar nuevos juegos siguiendo una estructura de carpetas definida. | Media |
| R10 | El juego debe mostrar la siguiente pieza (next piece preview). | Media |

### 2.2 Tetris Específico (v0.1)

| ID | Requisito | Detalle |
|----|-----------|---------|
| T01 | Mecánica base | 7 piezas estándar (I, J, L, O, S, T, Z). Sistema SRS básico o mecánica Game Boy original. |
| T02 | Sin niveles progresivos | La velocidad de caída es constante. No hay aumento de dificultad por líneas completadas. |
| T03 | Scoring | Clásico: 40/100/300/1200 por 1/2/3/4 líneas. Sin multiplicador de nivel. |
| T04 | Game Over | Cuando una pieza nueva no puede spawnear. Opción de restart. |
| T05 | Next Piece | Visualización de la siguiente pieza en un área dedicada del canvas. |
| T06 | Sin sonido | Ningún efecto de audio. |
| T07 | Visual con color | Paleta de colores tipo Game Boy Color, no escala de grises original. |
| T08 | Controles | Flechas: mover. ↑ / Espacio: rotar. ↓: soft drop. P: pausa. |
| T09 | Modo Automático | Una IA simple (heurística básica o random válida) juega indefinidamente. El objetivo es visual, no competitivo. |

---

## 3. Arquitectura Técnica

### 3.1 Stack

| Capa | Tecnología |
|------|------------|
| Lenguaje | TypeScript |
| API VS Code | Webview API (WebviewViewProvider para sidebar, WebviewPanel para fullscreen) |
| Renderizado | HTML5 Canvas 2D |
| Game Loop | requestAnimationFrame con timestep fijo |
| Bundling | esbuild (recomendado por VS Code para extensiones) o webpack |
| Testing | Mocha + VS Code Test CLI |

### 3.2 Estructura de Carpetas

```
VSArcade/
├── .vscode/
│   ├── launch.json              # Debug configuration
│   └── tasks.json
├── src/
│   ├── extension.ts             # Entry point. Registra commands y views.
│   ├── constants.ts             # IDs de comandos, vistas, colores globales.
│   ├── types/
│   │   └── game.d.ts            # Interfaces core: IGameEngine, IGameState.
│   ├── core/
│   │   ├── GameManager.ts       # Orquesta qué juego está activo, estado global.
│   │   ├── ArcadeViewProvider.ts # WebviewViewProvider para el sidebar.
│   │   └── FullscreenPanel.ts   # WebviewPanel para modo pantalla completa.
│   ├── input/
│   │   └── InputHandler.ts      # Abstrae input de teclado para el webview.
│   ├── games/
│   │   └── tetris/
│   │       ├── TetrisGame.ts    # Implementación de IGameEngine.
│   │       ├── TetrisRenderer.ts # Renderizado específico en canvas.
│   │       ├── TetrisAI.ts      # Lógica del modo automático.
│   │       ├── constants.ts     # Configuración del tablero, colores, piezas.
│   │       └── types.ts         # Tipos específicos de Tetris (Piece, Board, etc.).
│   └── utils/
│       └── canvas.ts            # Helpers de dibujo (dibuja grilla, borde, etc.).
├── media/
│   ├── arcade-icon.svg          # Icono de la pestaña en Activity Bar.
│   └── main.css                 # Estilos del webview (tema oscuro por defecto, adaptable).
├── out/                         # Código compilado (JS).
├── package.json                 # Manifest de la extensión.
├── tsconfig.json
├── webpack.config.js / esbuild.js
└── README.md
```

### 3.3 Contrato de GameEngine (Cómo Agregar un Juego)

Para que un juego sea reconocido por VSArcade, debe existir una carpeta bajo `src/games/{gameId}/` que exporte un objeto que implemente la siguiente interfaz:

```typescript
// src/types/game.d.ts

export interface IGameEngine {
  /** Identificador único del juego (kebab-case). */
  readonly id: string;

  /** Nombre visible en el selector. */
  readonly name: string;

  /** Versión del juego. */
  readonly version: string;

  /** Inicializa el juego. Recibe el contexto del canvas y configuración inicial. */
  init(canvas: HTMLCanvasElement, options: GameOptions): void;

  /** Libera recursos cuando el juego se cierra o cambia. */
  dispose(): void;

  /** Actualiza la lógica del juego. Llamado en cada tick del game loop. */
  update(deltaTime: number): void;

  /** Renderiza el estado actual en el canvas. Llamado en cada frame. */
  render(): void;

  /** Procesa input del teclado. */
  handleInput(key: string, isPressed: boolean): void;

  /** Activa o desactiva el modo automático. */
  setAutoPlay(enabled: boolean): void;

  /** Pausa o reanuda el juego. */
  setPaused(paused: boolean): void;

  /** Devuelve el estado serializable del juego (para persistencia futura). */
  getState(): GameStateSnapshot;

  /** Restaura el estado del juego. */
  loadState(state: GameStateSnapshot): void;
}

export interface GameOptions {
  autoPlay: boolean;
  theme: 'dark' | 'light';
}

export interface GameStateSnapshot {
  score: number;
  // Otros campos dependen del juego
}
```

**Registro:** En `src/core/GameManager.ts` se hará un import estático o dinámico de cada juego. Para v0.1 es suficiente con importar manualmente cada uno. En el futuro se puede hacer auto-discovery.

---

## 4. Especificación de UI/UX

### 4.1 Sidebar View (Default)

- **Ubicación:** Panel izquierdo, como una pestaña más (al nivel de Explorer, Search, Timeline).
- **Tamaño:** Se ajusta al ancho del sidebar (el usuario puede resizear). Mínimo recomendado: 250px.
- **Contenido:**
  - Header: nombre del juego activo + score.
  - Canvas: área de juego proporcional (respetando aspect ratio de Game Boy: 10:9 aprox).
  - Footer: controles hint (iconos de teclas) + botón de pausa + botón de modo automático + botón de fullscreen.

### 4.2 Pantalla Completa

- Trigger: botón en el sidebar o Command Palette `VSArcade: Toggle Fullscreen`.
- Se abre un `WebviewPanel` en el centro del editor.
- El juego continúa desde el estado actual (no se reinicia).
- Al cerrar el panel, el juego vuelve al sidebar si éste sigue visible, o se pausa.

### 4.3 Selector de Juego

- Command: `VSArcade: Select Game`
- UI: QuickPick de VS Code con lista de juegos registrados (nombre + versión + descripción corta).
- Al seleccionar, si ya hay un juego corriendo, se pregunta si se desea reiniciar o preservar el estado actual (para futuro, v0.1 puede reiniciar directamente).

### 4.4 Paleta de Colores (Tetris)

Inspirada en Game Boy Color. Cada pieza tiene su color clásico:

| Pieza | Color Hex |
|-------|-----------|
| I (barra) | `#00F0F0` (Cyan) |
| O (cuadrado) | `#F0F000` (Yellow) |
| T | `#A000F0` (Purple) |
| S | `#00F000` (Green) |
| Z | `#F00000` (Red) |
| J | `#0000F0` (Blue) |
| L | `#F0A000` (Orange) |

Fondo del tablero: `#9BBC0F` (verde clásico GB) o adaptable al tema de VS Code.

---

## 5. Game Loop y Timing

```
Timestep fijo: 16.67ms (60 FPS lógico)
Render: sincronizado con requestAnimationFrame

Si el tablero es 10x20 celdas:
- Celda size = calculado dinámicamente según el tamaño del canvas.
- Canvas size = 10*cellSize x 20*cellSize (+ área para next piece y score).
```

**Velocidad de caída (Tetris):** Constante. Una celda cada ~800ms (ajustable). Sin aumento progresivo.

---

## 6. Modo Automático / Infinito

**Comportamiento:**
- Una IA simple toma el control de `handleInput`.
- No necesita ser óptima. Estrategia sugerida para v0.1:
  1. Rotar la pieza un número aleatorio de veces (0-3).
  2. Moverla a una posición X aleatoria válida.
  3. Dejarla caer.
- Con el tiempo, se podría mejorar con una heurística simple (minimizar agujeros, preferir líneas bajas).
- El objetivo es **visual**: que el tablero nunca se llene del todo o que se reinicie automáticamente al Game Over.
- **Toggle:** Botón en la UI o comando `VSArcade: Toggle Auto Play`.

---

## 7. Roadmap de Implementación

### Fase 0 — Scaffold (v0.0.1)
- [ ] Crear estructura base de extensión VS Code (yo code generator o manual).
- [ ] Configurar build (esbuild), debug, y manifest.
- [ ] Registrar vista en Activity Bar con icono.
- [ ] Webview básico en sidebar que muestre "Hello VSArcade".

### Fase 1 — Tetris Core (v0.1.0)
- [ ] Implementar `IGameEngine` con `TetrisGame.ts`.
- [ ] Lógica de piezas, rotación (Game Boy style: sin wall kicks complejos, solo rotación básica).
- [ ] Detección de colisiones y líneas completadas.
- [ ] Renderizado en Canvas 2D con colores.
- [ ] Next piece preview.
- [ ] Score (sin niveles).
- [ ] InputHandler con keybindings.
- [ ] Game Over y Restart.
- [ ] Pausa.

### Fase 2 — Modos y UX (v0.2.0)
- [ ] Modo Automático (TetrisAI.ts).
- [ ] Comando `VSArcade: Select Game`.
- [ ] Comando `VSArcade: Toggle Fullscreen`.
- [ ] Pantalla completa en panel central.
- [ ] Persistencia de high score en `ExtensionContext.globalState`.

### Fase 3 — Pulido y Publicación (v0.3.0)
- [ ] Iconos y branding.
- [ ] README con GIFs/screenshots.
- [ ] Ajuste de tema oscuro/claro.
- [ ] Testing manual en distintos tamaños de sidebar.
- [ ] Publicar en VS Code Marketplace.
- [ ] Publicar en Open VSX.

### Fase 4 — Extensibilidad Validada (v0.4.0)
- [ ] Agregar segundo juego (ej. Snake o Pong) siguiendo el contrato `IGameEngine`.
- [ ] Documentar el proceso de agregar un juego para contribuidores.

---

## 8. Consideraciones Legales y de Marca

- **Tetris:** Es una marca registrada de The Tetris Company. La mecánica de juego (piezas cayendo, rotación, líneas) NO está patentada, pero el nombre "Tetris", los sonidos originales, y el branding específico sí son propiedad intelectual protegida.
- **Estrategia:**
  - No usar el nombre "Tetris" en el marketplace ni en el branding público de la extensión. Usar un nombre descriptivo como "Block Puzzle" o "Falling Blocks" dentro del juego.
  - La extensión se llama **VSArcade**, no "VS Code Tetris". El juego interno puede referirse como "Falling Blocks Classic".
  - No incluir assets, sprites, o música del Tetris original de Nintendo.
  - El código es una implementación limpia propia. Esto es legal (es como los miles de clones de Tetris que existen, siempre que no usen el nombre ni assets protegidos).
- **Open VSX:** Revisar términos de servicio, pero generalmente son más permisivos.

---

## 9. Checklist de Decisiones Técnicas Pendientes

Antes de empezar a codear, confirmar:

1. **¿Bundler?** Esbuild (rápido, recomendado por VS Code) vs Webpack (más configurable).
2. **¿Tamaño de celda dinámico o fijo?** Dinámico es mejor para responsive, pero más complejo.
3. **¿El canvas usa el tamaño físico del sidebar o tiene un tamaño fijo con scroll?** Sugiero: tamaño fijo lógico (ej. 160x144 escalado) para mantener pixel-perfect, pero responsive al contenedor.
4. **¿Guardar high scores por workspace o global?** Sugiero global.
5. **¿Tema visual adaptable a VS Code o paleta fija Game Boy?** Sugiero: fondo adaptable al tema de VS Code, piezas con colores fijos clásicos.

---

## 10. Glosario

| Término | Significado |
|---------|-------------|
| **Activity Bar** | Barra lateral izquierda de VS Code con iconos (Explorer, Search, etc.). |
| **Webview** | Componente de VS Code que permite renderizar HTML/CSS/JS dentro del editor. |
| **WebviewViewProvider** | API para mostrar un webview como una vista en la sidebar. |
| **WebviewPanel** | API para mostrar un webview como un panel/tab en el área central. |
| **SRS** | Super Rotation System. Sistema estándar moderno de rotación de Tetris. |
| **Soft Drop** | Hacer caer la pieza más rápido manteniendo una tecla presionada. |
| **Game Loop** | Ciclo de actualización y renderizado que corre continuamente mientras el juego está activo. |

---

> **Próximo paso:** Una vez confirmadas las decisiones técnicas pendientes (sección 9), se procede al scaffold del proyecto y la implementación de la Fase 0.
