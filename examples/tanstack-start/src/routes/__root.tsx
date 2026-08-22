import {
	HeadContent,
	Link,
	Outlet,
	Scripts,
	createRootRoute,
} from '@tanstack/react-router';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{ title: 'Conform / TanStack Start Example' },
		],
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
	component: App,
	shellComponent: RootDocument,
});

function App() {
	return (
		<main>
			<h1>TanStack Start Example</h1>

			<p>This example demonstrates the following features:</p>

			<ul>
				<li>
					<Link to="/login">Basic form with manual validation</Link>
				</li>
				<li>
					<Link to="/signup">Async validation</Link> (
					<Link to="/signup-async-schema">with async schema</Link>)
				</li>
				<li>
					<Link to="/todos" search={{ id: undefined }}>
						Dynamic form with data persistence
					</Link>
				</li>
				<li>
					<Link to="/file-upload">File upload</Link>
				</li>
			</ul>

			<hr />

			<Outlet />
		</main>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
