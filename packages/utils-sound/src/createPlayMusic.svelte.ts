import type { Howl } from 'howler';
import type { LoadedAudio } from 'pixi-svelte';

import type { PlayOptions, GetSound, GetSoundMap } from './types';

export function createPlayMusic<TSoundName extends string>(options: {
	howl: Howl;
	newSound: (value: TSoundName) => GetSound<TSoundName>;
	getSoundMap: () => GetSoundMap<TSoundName>;
	initSoundVolume: (soundName: TSoundName) => void;
	loadedAudio?: LoadedAudio<TSoundName>;
}) {
	type Sound = GetSound<TSoundName>;

	// When a non-looping music sound ends naturally, remove it from the map
	// so it can be replayed fresh the next time play() is called.
	// Looping sprites (bgm_main, bgm_freespin) fire onend at the end of each
	// cycle before restarting — we must NOT remove them, otherwise pauseAllMusic()
	// loses track of them and can't pause them during transitions.
	options.howl.on('end', (soundId: number) => {
		const soundMap = options.getSoundMap();
		const sound = (Object.values(soundMap) as Sound[]).find((s) => s.soundId === soundId);
		if (sound) {
			const spriteEntry = options.loadedAudio?.sprite[sound.soundName];
			const isLoopingSprite = Array.isArray(spriteEntry) && spriteEntry[2] === true;
			if (!isLoopingSprite) {
				delete soundMap[sound.soundName];
			}
		}
	});

	const pauseAllMusic = () => {
		(Object.values(options.getSoundMap()) as Sound[]).forEach((existingSound) => {
			options.howl.pause(existingSound.soundId);
			options.getSoundMap()[existingSound.soundName] = {
				...existingSound,
				soundState: 'paused',
			};
		});
	};

	const newMusic = (sound: Sound) => {
		pauseAllMusic();
		const soundId = options.howl.play(sound.soundName);
		options.getSoundMap()[sound.soundName] = {
			...sound,
			soundId,
			soundState: 'playing',
		};
		options.initSoundVolume(sound.soundName);
	};

	const resumeMusic = (sound: Sound) => {
		pauseAllMusic();
		// Check if soundId is valid (not 0, not undefined)
		// If valid, resume the existing sound, otherwise play a new instance
		if (sound.soundId && sound.soundId !== 0) {
			options.howl.play(sound.soundId);
			options.getSoundMap()[sound.soundName] = {
				...sound,
				soundState: 'playing',
			};
		} else {
			// Fall back to playing by name if soundId is invalid
			const soundId = options.howl.play(sound.soundName);
			options.getSoundMap()[sound.soundName] = {
				...sound,
				soundId,
				soundState: 'playing',
			};
			options.initSoundVolume(sound.soundName);
		}
	};

	const soundPlayMap = {
		new: (sound: Sound) => newMusic(sound),
		paused: (sound: Sound) => resumeMusic(sound),
		playing: (_: Sound) => {
			// Do nothing
		},
	};

	const play = (playOptions: PlayOptions<TSoundName>) => {
		const existingSound = options.getSoundMap()[playOptions.name];
		const sound = existingSound ?? options.newSound(playOptions.name);
		soundPlayMap[sound.soundState](sound);
	};

	return {
		play,
	};
}
