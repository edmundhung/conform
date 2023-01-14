import { Link, NavLink, Outlet, useLocation } from '@remix-run/react';
import { useEffect, useState } from 'react';

interface Navigation {
	title: string;
	menus: Array<{
		title: string;
		to: string;
	}>;
}

const navigations: Navigation[] = [
	{
		title: 'Guides',
		menus: [
			{ title: 'Overview', to: '/' },
			{ title: 'Get Started', to: '/tutorial' },
			{ title: 'Validation', to: '/validation' },
			{ title: 'Nested object and Array', to: '/configuration' },
			{ title: 'Integrations', to: '/integrations' },
			{ title: 'File Upload', to: '/file-upload' },
			{ title: 'Focus management', to: '/focus-management' },
			{ title: 'Accessibility', to: '/accessibility' },
		],
	},
	{
		title: 'API Reference',
		menus: [
			{ title: '@conform-to/react', to: '/api/react' },
			{ title: '@conform-to/yup', to: '/api/yup' },
			{ title: '@conform-to/zod', to: '/api/zod' },
		],
	},
	{
		title: 'Examples',
		menus: [
			{ title: 'Chakra UI', to: '/examples/chakra-ui' },
			{ title: 'Headless UI', to: '/examples/headless-ui' },
			{ title: 'Material UI', to: '/examples/material-ui' },
			{ title: 'Remix', to: '/examples/remix-run' },
			{ title: 'Yup', to: '/examples/yup' },
			{ title: 'Zod', to: '/examples/zod' },
		],
	},
];

export default function Guide() {
	const [navOpen, setNavOpen] = useState(false);
	const location = useLocation();

	useEffect(() => {
		setNavOpen(false);
	}, [location]);

	return (
		<>
			<header className="h-16 sticky top-0 w-full backdrop-blur z-50 border-b border-zinc-700 bg-zinc-900/75">
				<div className="lg:container mx-auto p-4 flex justify-between items-center">
					<div className="flex flex-row gap-4 items-center">
						<label
							htmlFor="nav"
							className="px-1 lg:hidden text-zinc-400 hover:text-white"
						>
							☰
						</label>
						<Link
							className="text-xl font-medium tracking-widest uppercase"
							to="/"
						>
							conform
						</Link>
					</div>
					<a
						className="text-zinc-400 hover:text-white"
						href="https://github.com/edmundhung/conform"
						title="GitHub"
					>
						<svg
							aria-hidden="true"
							focusable="false"
							className="w-6 h-6"
							role="img"
							viewBox="0 0 496 512"
						>
							<path
								fill="currentColor"
								d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
							></path>
						</svg>
					</a>
				</div>
			</header>
			<main className="lg:container mx-auto flex flex-col lg:flex-row">
				<input
					id="nav"
					className="peer hidden"
					type="checkbox"
					checked={navOpen}
					onChange={(e) => setNavOpen(e.target.checked)}
				/>
				<nav className="hidden flex-none lg:block lg:sticky lg:top-16 peer-checked:block peer-checked:sticky peer-checked:top-16 text-lg lg:w-72 w-full self-start overflow-y-auto peer-checked:backdrop-blur z-30 h-[calc(100vh-4rem)]">
					<ul className="space-y-5 px-4 py-8">
						{navigations.map((nav) => (
							<li key={nav.title}>
								{nav.title}
								<ul className="my-4">
									{nav.menus.map((item) => (
										<li key={item.title}>
											<NavLink
												className={({ isActive }: { isActive: boolean }) =>
													`block px-4 py-1 border-l ${
														isActive
															? 'text-white border-white'
															: 'text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:border-zinc-500'
													}`
												}
												to={item.to}
												prefetch="intent"
											>
												{item.title}
											</NavLink>
										</li>
									))}
								</ul>
							</li>
						))}
					</ul>
				</nav>
				<div className="flex-1">
					<div className="px-4 py-8">
						<Outlet />
					</div>
				</div>
			</main>
		</>
	);
}
