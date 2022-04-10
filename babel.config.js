module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: '14',
					esmodules: true,
				},
			},
		],
		'@babel/preset-react',
		'@babel/preset-typescript',
	],
	plugins: [],
};
