import { Link, NavLink, Outlet } from '@remix-run/react';

export default function Guide() {
	return (
		<>
			<header className="h-16 sticky top-0 w-full backdrop-blur z-50 border-b border-zinc-800 bg-zinc-900/75">
				<div className="lg:container mx-auto py-4 px-8 flex justify-between">
					<Link className="text-xl font-medium tracking-wider uppercase" to="/">
						conform
					</Link>
					<label htmlFor="nav" className="border px-1 rounded lg:hidden">
						≡
					</label>
				</div>
			</header>
			<main className="lg:container mx-auto flex flex-col lg:flex-row">
				<input id="nav" className="peer hidden" type="checkbox" />
				<nav className="hidden flex-none lg:block lg:sticky lg:top-16 peer-checked:block peer-checked:sticky peer-checked:top-16 text-lg lg:w-72 w-full self-start overflow-y-auto peer-checked:backdrop-blur z-30 peer-checked:border-b lg:border-none border-zinc-800 bg-zinc-900/75">
					<ul className="space-y-5 p-8">
						<li>
							Get Started
							<ul className="m-4 mr-0 space-y-2">
								<li>
									<NavLink to="/basics">Basics</NavLink>
								</li>
								<li>
									<NavLink to="/validation">Validation</NavLink>
								</li>
								<li>
									<NavLink to="/nested">Nested</NavLink>
								</li>
								<li>
									<NavLink to="/list">List</NavLink>
								</li>
								<li>
									<NavLink to="/advanced">Advanced</NavLink>
								</li>
							</ul>
						</li>
						<li>
							API Reference
							<ul className="m-4 mr-0 space-y-2">
								<li>
									<NavLink to="/api/react">@conform-to/react</NavLink>
								</li>
								<li>
									<NavLink to="/api/yup">@conform-to/yup</NavLink>
								</li>
								<li>
									<NavLink to="/api/zod">@conform-to/zod</NavLink>
								</li>
							</ul>
						</li>
						<li>
							Examples
							<ul className="m-4 mr-0 space-y-2">
								<li>
									<NavLink to="/examples/material-ui">Material UI</NavLink>
								</li>
								<li>
									<NavLink to="/examples/remix">Remix</NavLink>
								</li>
								<li>
									<NavLink to="/examples/yup">Yup</NavLink>
								</li>
								<li>
									<NavLink to="/examples/zod">Zod</NavLink>
								</li>
							</ul>
						</li>
					</ul>
				</nav>
				<div className="flex-1">
					<div className="p-8 lg:pl-0">
						<Outlet />
					</div>
				</div>
			</main>
		</>
	);
}
