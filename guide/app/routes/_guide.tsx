import { Link, NavLink, Outlet } from '@remix-run/react';

export default function Guide() {
	return (
		<>
			<header className="sticky top-0 w-full backdrop-blur transition-colors duration-500 z-50 border-b border-zinc-800">
				<div className="max-w-7xl mx-auto py-4 px-12">
					<Link className="text-xl font-medium tracking-wider uppercase" to="/">
						conform
					</Link>
				</div>
			</header>
			<main className="max-w-7xl mx-auto flex">
				<nav className="fixed top-16 py-8 px-12 w-80 text-lg overflow-y-auto">
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
				<section className="pl-80 py-8 px-12">
					<Outlet />
				</section>
			</main>
		</>
	);
}
