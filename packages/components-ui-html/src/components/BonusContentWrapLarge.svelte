<script lang="ts">
	import type { Snippet } from 'svelte';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';

	type Props = {
		maxListLength?: number; // Optional for compatibility with other wrap components
		bonusCardsActivate: Snippet;
		bonusCardsBuy: Snippet;
	};

	const props: Props = $props();
</script>

<div class="container">
	<BaseContent maxWidth="100%">
		<div class="bonuses-wrap" style="position: relative; z-index: 10;">
			{@render props.bonusCardsActivate()}
			{@render props.bonusCardsBuy()}
		</div>
	</BaseContent>
</div>

<style lang="scss">
	.container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.bonuses-wrap {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
	}
</style>
