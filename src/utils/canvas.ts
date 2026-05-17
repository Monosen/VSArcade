// ---------------------------------------------------------------
// VSArcade — Canvas Scaling Utility
// ---------------------------------------------------------------

/**
 * Scales the canvas to fit within its container while maintaining the
 * Game Boy logical aspect ratio (160:144).
 *
 * @param canvas The HTML canvas element to scale.
 * @param containerWidth The available width in the webview.
 * @param containerHeight The available height in the webview.
 * @param logicalWidth The logical width (default 160).
 * @param logicalHeight The logical height (default 144).
 * @returns The chosen CSS display dimensions (width, height).
 */
export function scaleCanvas(
  canvas: HTMLCanvasElement,
  containerWidth: number,
  containerHeight: number,
  logicalWidth = 160,
  logicalHeight = 144
): { displayWidth: number; displayHeight: number } {
  // Set the internal resolution to the logical size
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;

  // Calculate the scale factor to fit within the container
  // while maintaining the aspect ratio
  const scaleX = containerWidth / logicalWidth;
  const scaleY = containerHeight / logicalHeight;
  const scale = Math.min(scaleX, scaleY);

  // Round to whole pixels for crisp rendering
  const displayWidth = Math.floor(logicalWidth * scale);
  const displayHeight = Math.floor(logicalHeight * scale);

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  // Disable image smoothing for pixel-perfect rendering
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
  }

  return { displayWidth, displayHeight };
}

/**
 * Creates a ResizeObserver that keeps the canvas scaled properly
 * within its parent container.
 *
 * @param canvas The canvas element to observe.
 * @param logicalWidth The logical width (default 160).
 * @param logicalHeight The logical height (default 144).
 * @returns A function to disconnect the observer.
 */
export function observeCanvasResize(
  canvas: HTMLCanvasElement,
  logicalWidth = 160,
  logicalHeight = 144
): () => void {
  const parent = canvas.parentElement;
  if (!parent) {
    return () => {};
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        scaleCanvas(canvas, width, height, logicalWidth, logicalHeight);
      }
    }
  });

  observer.observe(parent);

  // Perform initial scaling
  const rect = parent.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    scaleCanvas(canvas, rect.width, rect.height, logicalWidth, logicalHeight);
  }

  return () => observer.disconnect();
}