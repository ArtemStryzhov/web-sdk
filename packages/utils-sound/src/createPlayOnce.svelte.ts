import type { Howl } from 'howler';

import type { PlayOptions, GetSound, GetSoundMap } from './types';

export function createPlayOnce<TSoundName extends string>(options: {
	howl: Howl;
	newSound: (value: TSoundName) => GetSound<TSoundName>;
	getSoundMap: () => GetSoundMap<TSoundName>;
	initSoundVolume: (soundName: TSoundName) => void;
}) {
	type Sound = GetSound<TSoundName>;

	const playOnce = (sound: Sound) => {
		const soundId = options.howl.play(sound.soundName);

		options.getSoundMap()[sound.soundName] = {
			...sound,
			soundId,
			soundState: 'playing',
		};

		options.initSoundVolume(sound.soundName);

		// Use once() instead of on() to avoid accumulating end-listeners on every play call.
		// howl.on('end') never removes the handler, causing thousands of orphaned listeners
		// after extended play sessions (major memory leak).
		options.howl.once('end', (soundIdOnEnd) => {
			if (soundIdOnEnd === soundId) {
				options.howl.stop(soundId);
				delete options.getSoundMap()[sound.soundName];
			}
		});
	};

	const soundPlayMap = {
		new: (sound: Sound) => playOnce(sound),
		paused: (sound: Sound) => playOnce(sound),
		playing: (sound: Sound, playOptions: { forcePlay?: boolean }) => {
			if (playOptions.forcePlay) playOnce(sound);
		},
	};

	const play = (playOptions: PlayOptions<TSoundName> & { forcePlay?: boolean }) => {
		const existingSound = options.getSoundMap()[playOptions.name];
		const sound = existingSound ?? options.newSound(playOptions.name);
		soundPlayMap[sound.soundState](sound, { forcePlay: playOptions.forcePlay });
	};

	return {
		play,
	};
}
