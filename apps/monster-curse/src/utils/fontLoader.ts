// Font loader utility for custom fonts
export async function loadCromFont(): Promise<void> {
  if (typeof window !== 'undefined' && 'FontFace' in window) {
    try {
      // Use absolute path from static assets
      const fontUrl = '/assets/fonts/Crom_v1.ttf';
      const font = new FontFace('Crom', `url(${fontUrl})`);
      await font.load();
      document.fonts.add(font);
      console.log('Crom font loaded successfully');
    } catch (error) {
      console.warn('Failed to load Crom font:', error);
    }
  }
}

// Load font immediately
if (typeof window !== 'undefined') {
  loadCromFont();
}
