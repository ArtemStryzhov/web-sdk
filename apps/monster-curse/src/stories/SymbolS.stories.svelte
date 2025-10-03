<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Symbols/S - Scatter Symbol',
		parameters: {
			layout: 'fullscreen',
		},
	});
</script>

<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import assets from '../game/assets';
</script>

<Story name="S Symbol - Win State">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container>
				<!-- Title -->
				<Text
					x={400}
					y={100}
					anchor={{ x: 0.5, y: 0 }}
					text="S Symbol - Win State"
					style={{
						fontFamily: 'Arial',
						fontSize: 32,
						fill: 0xffffff,
						fontWeight: 'bold',
					}}
				/>

				<!-- S Symbol in Win State -->
				<Container x={400} y={570}>
					<Symbol
						x={0}
						y={0}
						rawSymbol={{ name: 'S', scatter: true }}
						state="win"
						loop={true}
					/>
				</Container>
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>