import type {
	MetaFunction,
	LinksFunction,
	LoaderFunctionArgs,
} from '@remix-run/cloudflare';
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
	isRouteErrorResponse,
} from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { Guide } from '~/layout';
import { getMetadata } from '~/util';
import stylesUrl from '~/styles.css?url';

export const links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export function loader({ context }: LoaderFunctionArgs) {
	const meta = getMetadata(context);

	return json(meta);
}

export const meta: MetaFunction = () => [{ title: 'Conform Guide' }];

export function ErrorBoundary() {
	const error = useRouteError();

	return (
		<div className="flex flex-col h-screen items-center justify-center p-4">
			<h1 className="text-3xl font-medium tracking-wider">
				{isRouteErrorResponse(error)
					? `${error.status} ${error.statusText}`
					: error?.toString() ?? 'Unknown error'}
			</h1>
		</div>
	);
}

export default function App() {
	return (
		<Guide>
			<Outlet />
		</Guide>
	);
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<script
					defer
					data-domain="conform.guide"
					src="https://plausible.io/js/script.js"
				/>
			</head>
			<body className="antialiased bg-zinc-900 text-zinc-50">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
