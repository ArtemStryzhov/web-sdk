<script lang="ts">
	import type { Snippet } from 'svelte';

	import './global.scss';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	const base = (import.meta as any).env?.BASE_URL ?? '/';
	const assetBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const cromUrl = `${assetBase}/assets/fonts/crom/Crom_v1.ttf`;
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&family=Lalezar&family=Chelsea+Market&display=swap"
	/>
	<style>
		:root {
			--font-crom-url: url({cromUrl});
		}

		@font-face {
			font-family: 'Crom';
			src: var(--font-crom-url);
			font-weight: normal;
			font-style: normal;
			font-display: swap;
		}
	</style>
</svelte:head>

{@render props.children()}
