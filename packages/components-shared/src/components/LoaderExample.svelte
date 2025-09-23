<script lang="ts">
	import LoaderBase from './LoaderBase.svelte';
	import { onMount } from 'svelte';

	type Props = {
		src: string;
	};

	const props: Props = $props();

	let showText = $state(false);
	let maxWidth = $state(200); // Default size

	onMount(() => {
		const updateLoaderSize = () => {
			const width = window.innerWidth;
			if (width <= 768) {
				// Mobile: increase by 1.3x
				maxWidth = 200 * 1.3; // 260px
			} else {
				// Desktop and tablet: increase by 2x
				maxWidth = 200 * 2; // 400px
			}
		};

		updateLoaderSize();
		window.addEventListener('resize', updateLoaderSize);

		return () => {
			window.removeEventListener('resize', updateLoaderSize);
		};
	});
</script>

<LoaderBase
	maxWidth={maxWidth}
	backgroundColor={'#000000'}
	timeout={4600}
	src={props.src}
	oncomplete={() => (showText = false)}
/>

{#if showText}
	<span class="add-your-loader">Add Your Loader</span>
{/if}

<style lang="scss">
	.add-your-loader {
		z-index: 999;
		color: white;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, 10px);
	}
</style>
