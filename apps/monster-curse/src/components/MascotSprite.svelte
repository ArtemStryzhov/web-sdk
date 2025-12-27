<script lang="ts">
	import { getContextParent } from 'pixi-svelte';
	import * as PIXI from 'pixi.js';

	type Props = {
		texture: PIXI.Texture | null;
		anchor: { x: number; y: number };
		width: number;
		height: number;
	};

	const props: Props = $props();
	
	let sprite: PIXI.Sprite | null = $state(null);
	
	$effect(() => {
		const containerContext = getContextParent();
		if (containerContext && !sprite) {
			const container = containerContext.parent;
			// Create sprite with empty texture first, will be updated when texture is ready
			sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
			sprite.anchor.set(props.anchor.x, props.anchor.y);
			sprite.width = props.width;
			sprite.height = props.height;
			sprite.visible = true;
			sprite.alpha = 1;
			sprite.x = 0;
			sprite.y = 0;
			container.addChild(sprite);
		}
		
		// Update sprite texture whenever it changes
		if (sprite && props.texture) {
			const textureChanged = sprite.texture !== props.texture;
			if (textureChanged) {
				sprite.texture = props.texture;
			}
			sprite.anchor.set(props.anchor.x, props.anchor.y);
			sprite.width = props.width;
			sprite.height = props.height;
			sprite.visible = true;
			sprite.alpha = 1;
			
			// Force texture update on baseTexture
			if (props.texture.baseTexture) {
				props.texture.baseTexture.update();
			}
		}
	});
	
	$effect(() => {
		return () => {
			if (sprite) {
				const containerContext = getContextParent();
				if (containerContext) {
					containerContext.parent.removeChild(sprite);
				}
				sprite.destroy();
			}
		};
	});
</script>

