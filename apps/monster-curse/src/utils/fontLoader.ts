// Font loader utility for custom fonts
export async function loadCromFont(): Promise<void> {
  if (typeof window !== 'undefined' && 'FontFace' in window) {
    try {
      const fontUrl = new URL('../../static/assets/fonts/Crom_v1.ttf', import.meta.url).href;
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
