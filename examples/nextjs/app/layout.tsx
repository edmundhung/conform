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

					<p>
						This example demonstrates some of the features of Conform including{' '}
						<strong>client validation</strong>, <strong>nested list</strong>,
						and <strong>async validation with zod</strong>.
					</p>

					<ul>
						<li>
							<Link href="login">Login</Link>
						</li>
						<li>
							<Link href="todos">Todo list</Link>
						</li>
						<li>
							<Link href="signup">Signup</Link>
						</li>
					</ul>

					<hr />

					{children}
				</main>
			</body>
		</html>
	);
}
