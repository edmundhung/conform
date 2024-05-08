import type { MetaFunction, LinksFunction } from '@remix-run/node';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import stylesheet from '~/tailwind.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesheet }];
};

export const meta: MetaFunction = () => [
	{
		charset: 'utf-8',
		title: 'Conform Playground',
		viewport: 'width=device-width,initial-scale=1',
	},
];

export default function App() {
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="antialiased font-sans bg-gray-100 max-w-7xl mx-auto py-10 lg:px-8">
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
