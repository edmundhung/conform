import type {
	MetaFunction,
	LinksFunction,
	LoaderArgs,
} from '@remix-run/cloudflare';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch,
} from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import stylesUrl from '~/styles.css';
import { getBranch } from './context';

export let links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: stylesUrl },
		{
			rel: 'apple-touch-icon',
			sizes: '180x180',
			href: '/apple-touch-icon.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '32x32',
			href: '/favicon-32x32.png',
		},
		{
			rel: 'icon',
			type: 'image/png',
			sizes: '16x16',
			href: '/favicon-16x16.png',
		},
		{ rel: 'manifest', href: '/site.webmanifest' },
	];
};

export function loader({ context }: LoaderArgs) {
	const repository = 'edmundhung/conform';
	const branch = getBranch(context);

	return json({
		repository,
		branch,
	});
}

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Conform Guide',
	description: 'Make your form conform to the dom',
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
				<script
					defer
					data-domain="conform.guide"
					src="https://plausible.io/js/script.js"
				/>
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
