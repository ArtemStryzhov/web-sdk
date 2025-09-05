import WebFont from 'webfontloader';

import type { PixiPoint, Sizes } from './types';

export const REM = 16;
export const MIN_CLICKABLE_SIZE = 3 * REM; // 44 x 44 is minimum clickable size

export const getPointValues = ({
	point,
	defaultValue,
}: {
	point: PixiPoint;
	defaultValue: number;
}) => {
	const finalDefaultValue = defaultValue === undefined ? 0 : defaultValue;
	if (typeof point === 'number') return [point, point];
	return [point?.x || finalDefaultValue, point?.y || finalDefaultValue];
};

export const anchorToPivot = ({ anchor, sizes }: { anchor: PixiPoint; sizes: Sizes }) => {
	const { width, height } = sizes;
	const [anchorX, anchorY] = getPointValues({ point: anchor, defaultValue: 0 });
	return { x: width * anchorX, y: height * anchorY };
};

/**
 * Detects if WebGL is enabled.
 * Inspired from http://www.browserleaks.com/webgl#howto-detect-webgl
 *
 * @return { number } -1 for not Supported,
 *										0 for disabled
 *										1 for enabled
 */
export function detectWebGL() {
	// Check for the WebGL rendering context
	if (window && !!window.WebGLRenderingContext) {
		let canvas = document.createElement('canvas'),
			names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'],
			context = false;

		for (const i in names) {
			try {
				// @ts-ignore
				context = canvas.getContext(names[i]);
				// @ts-ignore
				if (context && typeof context.getParameter === 'function') {
					// WebGL is enabled.
					return 1;
				}
			} catch (e) {}
		}

		// WebGL is supported, but disabled.
		return 0;
	}

	// WebGL not supported.
	return -1;
}

// Global font loading state
let fontLoadingState = $state({
	isLoaded: false,
	isLoading: false,
	error: null as string | null
});

export const getFontLoadingState = () => fontLoadingState;

// Enhanced font loading with multiple detection methods
export const preloadFont = () =>
	new Promise<void>((resolve) => {
		if (fontLoadingState.isLoaded) {
			resolve();
			return;
		}

		fontLoadingState.isLoading = true;
		fontLoadingState.error = null;
		
		// Add loading class to body
		if (typeof document !== 'undefined') {
			document.body.classList.add('font-loading');
			document.body.classList.remove('font-loaded');
		}

		// Multi-method font loading approach
		let resolved = false;
		const markFontLoaded = () => {
			if (resolved) return;
			resolved = true;
			
			fontLoadingState.isLoaded = true;
			fontLoadingState.isLoading = false;
			
			// Update body classes
			if (typeof document !== 'undefined') {
				document.body.classList.remove('font-loading');
				document.body.classList.add('font-loaded');
			}
			
			
			// Force text re-measurement after font loads - multiple attempts for reliability
			const triggerRemeasurement = () => {
				if (typeof window !== 'undefined') {
					// Multiple re-measurement strategies
					window.dispatchEvent(new CustomEvent('fontLoaded', { detail: { fontFamily: 'Kanit' } }));
					
					// Force browser to recalculate all text layouts
					document.body.style.fontFamily = document.body.style.fontFamily;
					
					// Trigger multiple resize events with delays
					window.dispatchEvent(new Event('resize'));
					setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
					setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
					
					// Force style recalculation
					document.body.offsetHeight; // Trigger reflow
					
					// Additional custom event for components that need it
					window.dispatchEvent(new CustomEvent('fontLoadComplete'));
				}
			};
			
			// Immediate trigger
			triggerRemeasurement();
			
			// Delayed triggers for safety
			setTimeout(triggerRemeasurement, 100);
			setTimeout(triggerRemeasurement, 300);
			setTimeout(() => resolve(), 400);
		};

		// Method 1: CSS Font Loading API (modern browsers)
		if (typeof document !== 'undefined' && 'fonts' in document) {
			Promise.race([
				document.fonts.load('600 45px Kanit').then(() => {
					return document.fonts.ready;
				}),
				new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout for CSS API
			]).then(() => {
				if (!resolved) markFontLoaded();
			}).catch(() => {
				// CSS Font Loading API failed, falling back to WebFont
			});
		}

		// Method 2: WebFont Loader (fallback)
		try {
			WebFont.load({
				typekit: {
					id: 'aba0ebl',
				},
				active: () => {
					markFontLoaded();
				},
				inactive: () => {
					fontLoadingState.isLoading = false;
					fontLoadingState.error = 'Font loading inactive';
					
					// Remove loading class even if font fails
					if (typeof document !== 'undefined') {
						document.body.classList.remove('font-loading');
						document.body.classList.add('font-loaded'); // Use fallback fonts
					}
					
					if (!resolved) {
						resolved = true;
						resolve();
					}
				},
				timeout: 4000 // 4 second timeout for WebFont
			});
		} catch (error) {
			fontLoadingState.isLoading = false;
			fontLoadingState.error = error instanceof Error ? error.message : 'Unknown font loading error';
			
			if (!resolved) {
				resolved = true;
				resolve();
			}
		}

		// Method 3: Ultimate fallback timeout (reduced to not interfere with game loading)
		setTimeout(() => {
			if (!resolved) {
				markFontLoaded();
			}
		}, 3000); // 3 second timeout - shorter to not delay game
	});

export function propsSyncEffect<TProps extends object, TTarget>({
	props,
	target,
	ignore,
}: {
	props: TProps;
	target?: TTarget | (() => TTarget);
	ignore?: (keyof TProps)[];
}) {
	$effect(() => {
		// The whole thing is wrapped inside an $effect
		// and because of ”props[key]“，it will react with every single props updated.
		let targetInstance = target instanceof Function ? target() : target;
		if (targetInstance) {
			(Object.keys(props) as (keyof TProps)[])
				.filter((key) => (ignore ? !ignore.includes(key) : true))
				.forEach((key) => {
					if (props[key] !== undefined) {
						// @ts-ignore
						targetInstance[key] = props[key];
					}
				});
		}
	});
}
