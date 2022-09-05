import { type LinksFunction } from '@remix-run/cloudflare';
import { Link, NavLink, Outlet } from '@remix-run/react';
import stylesUrl from '~/styles/code.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

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
							Get Started
							<ul className="m-4 mr-0 space-y-2">
								<li>
									<NavLink to="/basic">Basic</NavLink>
								</li>
								<li>
									<NavLink to="/constraint">Constraint</NavLink>
								</li>
								<li>
									<NavLink to="/nested">Nested</NavLink>
								</li>
								<li>
									<NavLink to="/list">List</NavLink>
								</li>
								<li>
									<NavLink to="/remote">Remote</NavLink>
								</li>
							</ul>
						</li>
						<li>
							API References
							<ul className="m-4 mr-0 space-y-2">
								<li>
									<NavLink to="/api/react">@conform-to/react</NavLink>
								</li>
								<li>
									<NavLink to="/api/zod">@conform-to/zod</NavLink>
								</li>
								<li>
									<NavLink to="/api/yup">@conform-to/yup</NavLink>
								</li>
							</ul>
						</li>
						<li>
							Examples
							<ul className="m-4 mr-0 space-y-2">
								<li>
									<NavLink to="/examples/basic">Create React App</NavLink>
								</li>
								<li>
									<NavLink to="/examples/material-ui">Material UI</NavLink>
								</li>
								<li>
									<NavLink to="/examples/remix">Remix</NavLink>
								</li>
							</ul>
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
