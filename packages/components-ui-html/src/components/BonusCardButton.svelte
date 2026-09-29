<script lang="ts">
	import { Button } from 'components-shared';

	import BaseButtonContent from './BaseButtonContent.svelte';

	type Props = {
		label: string;
		onclick: () => void;
		disabled?: boolean;
		fontSize?: string;
	};

	const props: Props = $props();
</script>

<div class={`button-container ${props.disabled ? 'disabled' : ''}`}>
	<Button onclick={props.onclick} disabled={props.disabled}>
		<div class="button-background"></div>
		<BaseButtonContent>
			<span class="button-text" style:font-size={props.fontSize}>{props.label}</span>
		</BaseButtonContent>
	</Button>
</div>

<style lang="scss">
	.button-container {
		position: relative;
		width: 100%;
		height: 72px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.button-background {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 166px;
		height: 63px;
		transform: translate(-50%, -50%);
		background-image: var(--spritesheet-url);
		background-size: 2884px 2027px; /* full atlas */
		background-position: -1795px -1px; /* buy_btn_active */
		background-repeat: no-repeat;
		z-index: 0;
		pointer-events: none;
	}

	.button-container.disabled .button-background {
		background-position: -1795px -66px; /* buy_btn_disabled */
	}

	.button-text {
		position: relative;
		z-index: 1;
		font-family: 'Lalezar', sans-serif;
		font-weight: 400;
		font-style: normal;
		font-size: 39px; /* further -15% */
		line-height: 100%;
		text-align: center;
		color: #61e5ff;
	}
</style>
