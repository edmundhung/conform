import type { MetaFunction, LinksFunction } from '@remix-run/node';
import {
	Link,
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';
import stylesUrl from '~/styles.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Remix - Conform Example',
	viewport: 'width=device-width,initial-scale=1',
});

export default function App() {
	return (
		<html lang="en">
			<head>
				<Meta />
				<Links />
			</head>
			<body>
				<main>
					<h1>Remix Example</h1>

					<p>
						This example demonstrates some of the features of Conform including{' '}
						<strong>manual validation</strong>, <strong>nested list</strong>,
						and <strong>async validation with zod</strong>.
					</p>

					<ul>
						<li>
							<Link to="login">Login</Link>
						</li>
						<li>
							<Link to="todos">Todo list</Link>
						</li>
						<li>
							<Link to="signup">Signup</Link>
						</li>
					</ul>

					<hr />

					<Outlet />
				</main>
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
