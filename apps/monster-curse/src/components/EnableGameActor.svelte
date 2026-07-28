<script lang="ts">
	import { onMount } from 'svelte';

	import { Text } from 'pixi-svelte';
	import { stateMeta } from 'state-shared';
	import { stateUrlDerived } from 'state-shared';

	import { gameActor } from '../game/actor';
	import { getContext } from '../game/context';
	import { getBetModeMeta } from '../game/betModeMeta';

	type Props = {
		debug?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	onMount(() => {
		// Initialize custom bet mode metadata for Monster Curse
		stateMeta.betModeMeta = getBetModeMeta(stateUrlDerived.social());

		const { unsubscribe } = gameActor.subscribe((snapshot) => {
			context.stateXstate.value = snapshot.value;
			// const childActor = snapshot.children[snapshot.value];
		});

		gameActor.start();
		gameActor.send({ type: 'RENDERED' });

		return () => {
			// Equivalent to onDestroy(); Leave this comment for searching.
			unsubscribe();
			gameActor.stop();
		};
	});

	context.eventEmitter.subscribeOnMount({
		// Connect every actor with app.eventEmitter to avoid call actor directly
		bet: () => gameActor.send({ type: 'BET' }),
		autoBet: () => gameActor.send({ type: 'AUTO_BET' }),
		resumeBet: () => gameActor.send({ type: 'RESUME_BET' }),
		forceResult: () => gameActor.send({ type: 'FORCE_RESULT' }),
	});
</script>

{#if props.debug}
	<Text
		x={context.stateLayoutDerived.canvasSizes().width}
		anchor={{ x: 1, y: 0 }}
		style={{ fill: 0xffffff }}
		text={JSON.stringify(context.stateXstate.value, undefined, 2)}
	/>
{/if}
