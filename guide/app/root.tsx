import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
	isRouteErrorResponse,
} from 'react-router';
import type { Route } from './+types/root';
import { Guide } from '~/layout';
import { getMetadata } from '~/util';
import stylesUrl from '~/styles.css?url';

export const links: Route.LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export function loader({ context }: Route.LoaderArgs) {
	return getMetadata(context);
}

export const meta: Route.MetaFunction = () => [{ title: 'Conform Guide' }];

export function ErrorBoundary() {
	const error = useRouteError();

	return (
		<Document>
			<div className="flex flex-col h-screen items-center justify-center p-4">
				<h1 className="text-3xl font-medium tracking-wider">
					{isRouteErrorResponse(error)
						? `${error.status} ${error.statusText}`
						: (error?.toString() ?? 'Unknown error')}
				</h1>
			</div>
		</Document>
	);
}

export default function App() {
	return (
		<Document>
			<Guide>
				<Outlet />
			</Guide>
		</Document>
	);
}

function Document({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="antialiased bg-zinc-900 text-zinc-50">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}
