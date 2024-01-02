import type {
	MetaFunction,
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
import { getMetadata } from '~/util';
import stylesUrl from '~/styles.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export function loader({ context }: LoaderFunctionArgs) {
	const meta = getMetadata(context);

	return json(meta);
}

export const meta: MetaFunction = () => [
	{ charSet: 'utf-8' },
	{ title: 'Conform Guide' },
	{ name: 'viewport', content: 'width=device-width,initial-scale=1' },
];

export function ErrorBoundary() {
	const error = useRouteError();

	return (
		<Document>
			<div className="flex flex-col h-screen items-center justify-center p-4">
				<h1 className="text-3xl font-medium tracking-wider">
					{isRouteErrorResponse(error)
						? `${error.status} ${error.statusText}`
						: error?.toString() ?? 'Unknown error'}
				</h1>
			</div>
		</Document>
	);
}

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}

function Document({ children }: { children: React.ReactNode }) {
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
				{children}
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
