// Font loader utility for custom fonts
export async function loadCromFont(): Promise<void> {
  if (typeof window !== 'undefined' && 'FontFace' in window) {
    try {
      // Use absolute path from static assets
      const fontUrl = '/assets/fonts/Crom_v1.ttf';
      const font = new FontFace('Crom', `url(${fontUrl})`);
      await font.load();
      document.fonts.add(font);
    } catch (error) {
      // Silently fail if font can't be loaded
    }
  }
}

// Load font immediately
if (typeof window !== 'undefined') {
  loadCromFont();
}
