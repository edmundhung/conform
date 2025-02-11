import type { Metadata } from 'next';
import Link from 'next/link';

// These styles apply to every route in the application
import './globals.css';

export const metadata: Metadata = {
	title: 'NextJS - Conform Example',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>
				<main>
					<h1>NextJS Example</h1>
					<p>This example demonstrates the following features:</p>
					<ul>
						<li>
							<Link href="login">Basic form with client validation</Link>
						</li>
						<li>
							<Link href="signup">Async validation</Link>
						</li>
						<li>
							<Link href="todos">Dynamic form with data persistence</Link>
						</li>
					</ul>

					<hr />

					{children}
				</main>
			</body>
		</html>
	);
}
