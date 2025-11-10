<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateUrlDerived } from 'state-shared';
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();
	
	// Hide during bonus game (freegame)
	const shouldShow = $derived(context.stateGame.gameType !== 'freegame');
</script>

{#if shouldShow}
	<MainContainer alignVertical="bottom" zIndex={10000}>
		<Sprite
			key="pressToContinueText_{stateUrlDerived.lang()}.png"
			width={800}
			height={134}
			anchor={{ x: 0.5, y: 1 }}
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height}
			zIndex={10000}
		/>
	</MainContainer>
{/if}
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
