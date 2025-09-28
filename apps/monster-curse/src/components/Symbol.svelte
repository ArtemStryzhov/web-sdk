<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolComposite from './SymbolComposite.svelte';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { getSymbolConfig } from '../config/symbolConfig';
	import { BitmapText, Text, Graphics, Container } from 'pixi-svelte';
	import '../utils/fontLoader';


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
		showWinFrame={props.state === 'win' && !['S'].includes(props.rawSymbol.name)}
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
	<Container x={props.x} y={props.y} anchor={0.5}>
		<!-- Gradient border background -->
		<Graphics
			x={0}
			y={0}
			draw={(g) => {
				g.clear();
				// Create gradient border effect
				const width = 80;
				const height = 60;
				
				// Outer border with gradient colors
				g.lineStyle(5, 0xFF70EA, 1);
				g.drawRoundedRect(-width/2, -height/2, width, height, 8);
				
				// Inner area
				g.lineStyle(0);
				g.beginFill(0x000000, 0.3);
				g.drawRoundedRect(-width/2 + 5, -height/2 + 5, width - 10, height - 10, 5);
				g.endFill();
			}}
		/>
		
		<!-- Drop shadow -->
		<Text
			anchor={0.5}
			x={3}
			y={3}
			text={`${props.rawSymbol.multiplier}x`}
			style={{
				fontFamily: 'Crom, Arial, sans-serif',
				fontWeight: 'bold',
				fill: 0xBF00B5,
				fontSize: 50,
			}}
		/>
		
		<!-- Main text -->
		<Text
			anchor={0.5}
			x={0}
			y={0}
			text={`${props.rawSymbol.multiplier}x`}
			style={{
				fontFamily: 'Crom, Arial, sans-serif',
				fontWeight: 'bold',
				fill: 0x61E5FF,
				fontSize: 50,
				stroke: 0x7B15FF,
				strokeThickness: 3,
			}}
		/>
	</Container>
{/if}
