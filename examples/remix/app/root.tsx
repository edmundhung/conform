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

const repository = 'https://github.com/edmundhung/conform';

function getSource(pathname: string): string | null {
	switch (pathname) {
		case '/search':
			return `${repository}/blob/main/examples/remix/app/routes/search.tsx`;
		case '/signup':
			return `${repository}/blob/main/examples/remix/app/routes/signup.tsx`;
		case '/order':
			return `${repository}/blob/main/examples/remix/app/routes/order.tsx`;
		case '/material-ui':
			return `${repository}/blob/main/examples/remix/app/routes/material-ui.tsx`;
	}

	return null;
}

export default function App() {
	const location = useLocation();
	const source = getSource(location.pathname);

	return (
		<html lang="en" className="h-full bg-gray-50">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<div className="max-w-lg mx-auto p-8">
					<Outlet />
					{location.pathname !== '/' ? (
						<footer className="flex justify-between text-sm p-8 flex-row-reverse">
							{source ? (
								<a
									className="hover:underline"
									href={source}
									target="_blank"
									rel="noopener noreferrer"
								>
									[Source]
								</a>
							) : null}
							<Link className="hover:underline" to="/">
								Back
							</Link>
						</footer>
					) : null}
				</div>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
