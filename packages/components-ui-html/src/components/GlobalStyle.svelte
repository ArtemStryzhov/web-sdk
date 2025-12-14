<script lang="ts">
	import type { Snippet } from 'svelte';

	import './global.scss';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	// Bundle the font with the library so it is available in any host app.
	// Vite/SvelteKit will emit the hashed asset URL at build time.
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	import cromUrl from '../assets/fonts/Crom_v1.ttf?url';
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
