import { Link, NavLink, Outlet } from '@remix-run/react';

export default function Guide() {
	return (
		<>
			<header className="sticky top-0 w-full backdrop-blur transition-colors duration-500 z-50 border-b border-zinc-800">
				<div className="container mx-auto py-4 px-8">
					<Link className="text-xl font-medium tracking-wider uppercase" to="/">
						conform
					</Link>
				</div>
			</header>
			<main className="container mx-auto flex">
				<nav className="flex-none sticky top-16 py-8 px-8 text-lg w-72 self-start overflow-y-auto">
					<ul className="space-y-5">
						<li>
							<NavLink to="playground">Playground</NavLink>
						</li>
						<li>
							<NavLink to="api">API References</NavLink>
						</li>
						<li>
							<NavLink to="examples">Examples</NavLink>
						</li>
						<li>
							<a href="https://github.com/edmundhung/conform">GitHub</a>
						</li>
					</ul>
				</nav>
				<div className="flex-1">
					<Outlet />
				</div>
			</main>
		</>
	);
}
