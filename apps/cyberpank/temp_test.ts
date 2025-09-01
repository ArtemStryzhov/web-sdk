export default {
	providerName: 'sample_provider',
	gameName: 'sample_cyberpank',
	gameID: '0_0_cyberpank',
	rtp: 0.9700,
	numReels: 6,
	numRows: [5, 5, 5, 5, 5, 5],
	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.9700,
			max_win: 10000.0,
			description: 'default game entry type',
		},
		bonus: {
			cost: 100.0,
			feature: false,
			buyBonus: true,
			rtp: 0.9700,
			max_win: 10000.0,
			description: 'buy bonus feature',
		},
	},
	symbols: {
		H4: {
			paytable: [
				{
					'8': 20.0,
				},
				{
					'9': 20.0,
				},
				{
					'10': 50.0,
				},
				{
					'11': 50.0,
				},
				{
					'12': 100.0,
				},
			],
		},
		L2: {
			paytable: [
				{
					'8': 0.8,
				},
				{
					'9': 0.8,
				},
				{
					'10': 1.8,
				},
				{
					'11': 1.8,
				},
				{
					'12': 8.0,
				},
			],
		},
		H3: {
			paytable: [
				{
					'8': 5.0,
				},
				{
					'9': 5.0,
				},
				{
					'10': 20.0,
				},
				{
					'11': 20.0,
				},
				{
					'12': 50.0,
				},
			],
		},
		H1: {
			paytable: [
				{
					'8': 3.0,
				},
				{
					'9': 3.0,
				},
				{
					'10': 4.0,
				},
				{
					'11': 4.0,
				},
				{
					'12': 24.0,
				},
