import type { Preview } from '@storybook/svelte';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

// Import Kanit font for storybook (only in browser environment)
if (typeof document !== 'undefined') {
	const fontLink = document.createElement('link');
	fontLink.rel = 'stylesheet';
	fontLink.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap';
	document.head.appendChild(fontLink);

	// Apply global Kanit font styling
	const globalStyle = document.createElement('style');
	globalStyle.textContent = `
	  body, #storybook-root {
	    font-family: 'Kanit', Arial, sans-serif !important;
	  }
	  
	  * {
	    font-family: 'Kanit', Arial, sans-serif;
	  }
	`;
	document.head.appendChild(globalStyle);
}

const preview: Preview = {
	parameters: {
		layout: 'fullscreen',
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		viewport: {
			options: {
				...INITIAL_VIEWPORTS,
				stake: {
					name: 'stake iframe',
					styles: {
						width: '1200px',
						height: '675px',
					},
				},
			},
		},
	},
	initialGlobals: {
    viewport: { value: 'stake', isRotated: false },
  },
};

export default preview;
