<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolComposite from './SymbolComposite.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { getSymbolConfig } from '../config/symbolConfig';
	import { BitmapText } from 'pixi-svelte';

type Props = {
	x?: number;
	y?: number;
	state: SymbolState;
	rawSymbol: RawSymbol;
	oncomplete?: () => void;
	loop?: boolean;
	key?: string;
};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isComposite = $derived((symbolInfo as any).composite === true);

	// Check if symbol has configuration (meaning it should use SymbolComposite)
	const hasSymbolConfig = $derived(getSymbolConfig(props.rawSymbol.name) !== null);

	// Force reactivity when state changes
	$effect(() => {
		props.state;
		props.key;
	});
</script>

		{#if isSprite && (isComposite || hasSymbolConfig)}
			<SymbolComposite {symbolInfo} rawSymbol={props.rawSymbol} x={props.x} y={props.y} state={props.state} loop={props.loop} oncomplete={props.oncomplete} />
	{:else if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		showWinFrame={props.state === 'win' && !['S', 'M'].includes(props.rawSymbol.name)}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
			},
		}}
	/>
{/if}

{#if props.rawSymbol.multiplier}
	<BitmapText
		anchor={0.5}
		x={props.x}
		y={props.y}
		text={`${props.rawSymbol.multiplier}X`}
		style={{
			fontFamily: 'gold',
			fontSize: 50,
		}}
	/>
{/if}
