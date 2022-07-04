import { type MetaFunction, type LinksFunction } from '@remix-run/node';
import {
	Links,
	Link,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from '@remix-run/react';
import stylesUrl from '~/styles/tailwind.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Conform demo',
	viewport: 'width=device-width,initial-scale=1',
});

export default function App() {
	const location = useLocation();

	return (
		<html lang="en" className="h-full bg-gray-50">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<div className="max-w-lg mx-auto p-8">
					<Outlet />
					<footer className="flex justify-between text-sm p-8 flex-row-reverse">
						<a
							className="hover:underline"
							href="https://github.com/edmundhung/conform"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub
						</a>
						{location.pathname !== '/' ? (
							<Link className="hover:underline" to="/">
								More examples
							</Link>
						) : null}
					</footer>
				</div>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
