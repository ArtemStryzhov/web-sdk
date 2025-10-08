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

	// Complete immediately to prevent hanging, regardless of spine animation
	onMount(() => {
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
