import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';
import stylesUrl from './styles.css?url';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const meta: MetaFunction = () => [
	{
		charset: 'utf-8',
		title: 'Conform / Remix Example',
		viewport: 'width=device-width,initial-scale=1',
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<main>
			<h1>Remix Example</h1>

			<p>This example demonstrates the following features:</p>

			<ul>
				<li>
					<Link to="login">Basic form with client validation</Link> (
					<Link to="login-fetcher">with useFetcher</Link>)
				</li>
				<li>
					<Link to="signup">Async validation</Link>
				</li>
				<li>
					<Link to="todos">Dynamic form with data persistence</Link>
				</li>
			</ul>

			<hr />

			<Outlet />
		</main>
	);
}
