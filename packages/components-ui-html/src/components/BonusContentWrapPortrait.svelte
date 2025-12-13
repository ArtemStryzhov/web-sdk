<script lang="ts">
	import type { Snippet } from 'svelte';

	import { getContextLayout } from 'utils-layout';
	import { resizeObserver, type ContentRect } from 'utils-resize-observer';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';

	type Props = {
		maxListLength: number;
		bonusCardsActivate: Snippet;
		bonusCardsBuy: Snippet;
	};

	const props: Props = $props();

	const { stateLayoutDerived } = getContextLayout();

	let contentRect = $state({ width: 0, height: 0, left: 0, top: 0 } as ContentRect);

const canvasSizes = $derived(stateLayoutDerived.canvasSizes());
const horizontalScale = $derived(
	canvasSizes.width / (240 * (props.maxListLength || 1)),
); // {maxListLength} columns, 240 is the width benchmark
const verticalScale = $derived(
	(canvasSizes.height - 250) / (contentRect?.height || 0),
);
const rawScale = $derived(Math.min(verticalScale, horizontalScale));
const scale = $derived(canvasSizes.width < 420 ? 1 : Math.min(rawScale, 1));
const scaled = $derived(scale < 1);
</script>

<div class="container">
	<BaseContent maxWidth="100%">
		<div class="wrap" style="position: relative; z-index: 10;">
			<div
				class="bonuses"
				style="transform: scale({Math.min(scale, 1)});"
				use:resizeObserver={(value) => (contentRect = value)}
			>
				<BaseScrollable type="row" noScroll>
					{@render props.bonusCardsActivate()}
				</BaseScrollable>

				<BaseScrollable type="row" noScroll>
					{@render props.bonusCardsBuy()}
				</BaseScrollable>
			</div>
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

	.wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 20px;
	}

	.bonuses {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;

		transform-origin: center center;
	}

	@media (max-width: 420px) {
		.wrap {
			gap: 0;
		}
		.bonuses {
			gap: 0;
		}
	}
</style>
