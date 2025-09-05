<script lang="ts" module>
	import * as PIXI from 'pixi.js';

	import type { Sizes, OverwriteCursor } from '../types';

	export type Props = OverwriteCursor<PIXI.TextOptions> & {
		onresize?: (arg0: Sizes) => void;
	};
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	import { propsSyncEffect } from '../utils.svelte';
	import { getContextParent } from '../context.svelte';

	const props: Props = $props();
	const parentContext = getContextParent();
	const text = new PIXI.Text({ text: props.text, style: props.style });

	propsSyncEffect({ props, target: text, ignore: ['onresize'] });

	$effect(() => {
		props?.text;
		props?.style;
		props.onresize?.({ width: text.width, height: text.height });
	});

	// Listen for font loading completion
	const handleFontLoaded = () => {
		// Force text style update to trigger re-measurement
		if (text && props.style?.fontFamily?.includes('Kanit')) {
			text.style = { ...text.style }; // Trigger style update
			// Re-measure after style update
			setTimeout(() => {
				props.onresize?.({ width: text.width, height: text.height });
			}, 50);
		}
	};

	onMount(() => {
		props.onresize?.({ width: text.width, height: text.height });

		if (typeof window !== 'undefined') {
			window.addEventListener('fontLoaded', handleFontLoaded);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('fontLoaded', handleFontLoaded);
		}
	});

	parentContext.addToParent(text);
</script>
