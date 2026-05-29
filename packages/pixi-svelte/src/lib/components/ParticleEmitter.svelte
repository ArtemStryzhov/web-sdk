<script lang="ts" module>
	import {
		Emitter,
		upgradeConfig,
		type EmitterConfigV3,
		type EmitterConfigV2,
		type EmitterConfigV1,
	} from '@barvynkoa/particle-emitter';

	import type { LoadedSpriteSheet } from '../types';

	export type Props = Partial<Emitter> & {
		key: string;
		emitSpeed?: number;
		config: EmitterConfigV3 | EmitterConfigV2 | EmitterConfigV1;
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { getContextApp, getContextParent } from '../context.svelte';
	import { propsSyncEffect } from '../utils.svelte';

	const props: Props = $props();
	const context = getContextApp();
	const parentContext = getContextParent();
	const textures = $derived(context.stateApp.loadedAssets?.[props.key] as LoadedSpriteSheet);
	const updatedConfig = $derived(upgradeConfig(props.config, textures));
	// svelte-ignore state_referenced_locally
	const emitter = new Emitter(parentContext.parent, updatedConfig);

	propsSyncEffect({ props, target: emitter, ignore: ['emit'] });

	$effect(() => {
		if (props.emit) emitter.init(updatedConfig);
	});

	// Keep a reference to the ticker function so it can be removed on destroy.
	// Previously the listener was added but never removed, accumulating on each mount.
	let tickerFn: (() => void) | null = null;

	if (context.stateApp.pixiApplication) {
		const ticker = context.stateApp.pixiApplication.ticker;
		tickerFn = () => {
			if (context.stateApp.pixiApplication) {
				const deltaUpdate =
					context.stateApp.pixiApplication.ticker.deltaMS * (props.emitSpeed || 0.00234);
				emitter.update(deltaUpdate);
			}
		};
		ticker.add(tickerFn);
	}

	onDestroy(() => {
		if (tickerFn && context.stateApp.pixiApplication) {
			context.stateApp.pixiApplication.ticker.remove(tickerFn);
		}
		emitter.emit = false;
		emitter.destroy();
	});
</script>
