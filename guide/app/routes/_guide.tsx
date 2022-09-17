import { Link, NavLink, Outlet } from '@remix-run/react';

export default function Guide() {
	return (
		<>
			<header className="sticky top-0 w-full backdrop-blur transition-colors duration-500 z-50 border-b border-zinc-800 bg-zinc-900/75">
				<div className="container mx-auto py-4 px-8">
					<Link className="text-xl font-medium tracking-wider uppercase" to="/">
						conform
					</Link>
				</div>
			</header>
			<main className="container mx-auto flex flex-col lg:flex-row p-4">
				<nav className="lg:flex-none lg:sticky lg:top-16 p-4 text-lg lg:w-72 self-start overflow-y-auto">
					<ul className="space-y-5">
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
				<div className="flex-1 p-4">
					<Outlet />
				</div>
			</main>
		</>
	);
}
