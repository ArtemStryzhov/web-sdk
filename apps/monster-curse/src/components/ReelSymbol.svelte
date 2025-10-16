<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolInfo, getSymbolX } from '../game/utils';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();
	const symbolInfo = $derived(
		getSymbolInfo({ rawSymbol: props.reelSymbol.rawSymbol, state: props.reelSymbol.symbolState }),
	);

	// Force reactivity when symbol state changes
	$effect(() => {
		const currentState = props.reelSymbol.symbolState;
		// Force the symbol to complete after a delay if it doesn't complete normally
		if (currentState === 'win' && props.reelSymbol.oncomplete) {
			// Give normal completion 3 seconds to work, then force complete
			setTimeout(() => {
				if (props.reelSymbol.symbolState === 'win' && props.reelSymbol.oncomplete) {
					props.reelSymbol.oncomplete();
				}
			}, 3000);
		}
	});
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY()}
	symbolIndex={props.reelSymbol.symbolIndex}
	animating={symbolInfo?.type === 'spine' &&
		(props.reelSymbol.symbolState === 'land' || props.reelSymbol.symbolState === 'win')}
>
	<Symbol
		key={`${props.reelSymbol.rawSymbol.name}-${props.reelSymbol.symbolState}`}
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			// Always call oncomplete if it exists, since the promise was set up to wait for completion
			props.reelSymbol.oncomplete?.();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>
