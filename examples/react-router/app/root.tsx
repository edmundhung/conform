import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from 'react-router';
import type { Route } from './+types/root';
import './app.css';
import { FormOptionsProvider } from '@conform-to/react/future';
import type { z } from 'zod';
import { formatResult, getZodConstraint } from '@conform-to/zod/v3/future';

declare module '@conform-to/react/future' {
	interface CustomSchema<Schema> {
		baseType: z.ZodTypeAny;
		input: Schema extends z.ZodTypeAny ? z.input<Schema> : unknown;
		output: Schema extends z.ZodTypeAny ? z.output<Schema> : unknown;
		options: Partial<z.ParseParams>;
	}
}

export function meta() {
	return [
		{
			charset: 'utf-8',
			title: 'Conform / React Router Example',
			viewport: 'width=device-width,initial-scale=1',
		},
	];
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<main>
			<h1>React Router Example</h1>

			<p>This example demonstrates the following features:</p>

			<ul>
				<li>
					<Link to="login">Basic form with manual validation</Link> (
					<Link to="login-fetcher">with useFetcher</Link>)
				</li>
				<li>
					<Link to="signup">Async validation</Link> (
					<Link to="signup-async-schema">with async schema</Link> /
					<Link to="signup-server-validation">with server validation</Link>)
				</li>
				<li>
					<Link to="todos">Dynamic form with data persistence</Link>
				</li>
			</ul>

			<hr />

			<FormOptionsProvider
				validateSchema={(schema, { schemaOptions, payload }) => {
					try {
						const result = schema.safeParse(payload, schemaOptions);
						return formatResult(result);
					} catch {
						return schema
							.safeParseAsync(payload, schemaOptions)
							.then((result) => formatResult(result));
					}
				}}
				getConstraint={getZodConstraint}
			>
				<Outlet />
			</FormOptionsProvider>
		</main>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!';
	let details = 'An unexpected error occurred.';
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error';
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
