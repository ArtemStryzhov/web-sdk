<script lang="ts">
	import type { Snippet } from 'svelte';

	import './global.scss';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	// Use SvelteKit assets path so fonts resolve when the app is served behind a prefix or CDN.
	// Falls back to BASE_URL (or root) when assets is empty (e.g., during dev).
	// @ts-ignore - available at app runtime; ignored in package typecheck
	import { assets } from '$app/paths';
	const base = (assets ?? (import.meta as any).env?.BASE_URL ?? '') as string;
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
