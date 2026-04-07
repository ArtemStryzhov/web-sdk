<script lang="ts">
	import { SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import type { RawSymbol } from '../game/types';
	import SymbolSpineMain from './SymbolSpineMain.svelte';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		rawSymbol: RawSymbol;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		showWinFrame: boolean;
		loop?: boolean;
	};

	const props: Props = $props();

	// Most symbols can complete immediately and rely on higher-level timeouts, but S expand
	// must wait for its real visual animation. Completing on mount causes board logic to move on
	// while the sword is still at revealProgress=0, which is the root of the cut/frozen bug.
	onMount(() => {
		const isSExpandAnimation =
			props.rawSymbol.name === 'S' && props.symbolInfo?.animationName?.startsWith('sword_expanding');

		if (isSExpandAnimation) {
			return;
		}

		props.listener?.complete?.({} as any);
	});
</script>

<!-- main -->
<SymbolSpineMain
	x={props.x}
	y={props.y}
	symbolInfo={props.symbolInfo}
	rawSymbol={props.rawSymbol}
	listener={props.listener}
	loop={props.loop}
/>

<!-- tumble frame (payframe) - now rendered in Payframes.svelte component -->
