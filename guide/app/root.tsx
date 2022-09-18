import type { MetaFunction, LinksFunction } from '@remix-run/cloudflare';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch,
} from '@remix-run/react';
import stylesUrl from '~/styles.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Conform Guide',
	viewport: 'width=device-width,initial-scale=1',
});

export function CatchBoundary() {
	const caught = useCatch();

	return (
		<html>
			<head>
				<title>Oops!</title>
				<Meta />
				<Links />
			</head>
			<body className="font-['Ubuntu','sans-serif'] antialiased bg-zinc-900 text-white flex flex-col h-screen items-center justify-center p-4">
				<h1 className="text-3xl font-medium tracking-wider">
					{caught.status} {caught.statusText}
				</h1>
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="font-['Ubuntu','sans-serif'] antialiased bg-zinc-900 text-white">
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
