export default function Index() {
	return (
		<div className="flex flex-col h-screen items-center justify-center bg-black text-white p-4">
			<a
				className="text-3xl font-medium tracking-wider rounded p-0.5 bg-white hover:bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
				href="https://github.com/edmundhung/conform"
			>
				<h1 className="bg-black rounded py-8 px-6 md:px-20 text-center">
					Conform Guide
					<sup className="block mt-3 -mb-3 text-center text-xs">
						Coming soon
					</sup>
				</h1>
			</a>
		</div>
	);
}
