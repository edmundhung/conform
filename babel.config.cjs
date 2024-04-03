module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: '16',
					esmodules: true,
				},
			},
		],
		['@babel/preset-react', { runtime: 'automatic' }],
		'@babel/preset-typescript',
	],
	plugins: [],
};
