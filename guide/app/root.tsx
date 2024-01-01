import type {
	V2_MetaFunction as MetaFunction,
	LinksFunction,
	LoaderFunctionArgs,
} from '@remix-run/cloudflare';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
	isRouteErrorResponse,
} from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import stylesUrl from '~/styles.css';
import { getBranch } from './context';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export function loader({ context }: LoaderFunctionArgs) {
	const repository = 'edmundhung/conform';
	const branch = getBranch(context);

	return json({
		repository,
		branch,
	});
}

export const meta: MetaFunction = () => [
	{ charSet: 'utf-8' },
	{ title: 'Conform Guide' },
	{ name: 'description', content: 'Make your form conform to the dom' },
	{ name: 'viewport', content: 'width=device-width,initial-scale=1' },
];

export function ErrorBoundary() {
	const error = useRouteError();

	return (
		<html>
			<head>
				<title>Oops!</title>
				<Meta />
				<Links />
			</head>
			<body className="font-['Ubuntu','sans-serif'] antialiased bg-zinc-900 text-white flex flex-col h-screen items-center justify-center p-4">
				<h1 className="text-3xl font-medium tracking-wider">
					{isRouteErrorResponse(error)
						? `${error.status} ${error.statusText}`
						: error?.toString() ?? 'Unknown error'}
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
