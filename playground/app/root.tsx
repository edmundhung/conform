import type {
	MetaFunction,
	LinksFunction,
	LoaderFunction,
} from '@remix-run/node';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';

import stylesUrl from '~/styles/tailwind.css';
import { getFormConfig } from '~/config';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Conform Playground',
	viewport: 'width=device-width,initial-scale=1',
});

export let loader: LoaderFunction = ({ request }) => {
	const url = new URL(request.url);
	const config = getFormConfig(url.searchParams);

	return config;
};

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
