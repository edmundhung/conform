import {
	type MetaFunction,
	type LinksFunction,
	type LoaderArgs,
} from '@remix-run/cloudflare';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useCatch,
} from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import clsx from 'clsx';
import { getBranch } from '~/context';
import { parseColorScheme } from '~/services/color-scheme/server';
import {
	ColorSchemeScript,
	useColorScheme,
} from '~/services/color-scheme/components';
import {
	useMobileNavigation,
	MobileNavigation,
} from '~/services/navigation/components';
import stylesUrl from '~/styles.css';

export let links: LinksFunction = () => {
	return [{ rel: 'stylesheet', href: stylesUrl }];
};

export async function loader({ request, context }: LoaderArgs) {
	const colorScheme = await parseColorScheme(request);
	const repository = 'edmundhung/conform';
	const branch = getBranch(context);

	return json({
		colorScheme,
		repository,
		branch,
	});
}

export const meta: MetaFunction = () => ({
	title: 'Conform Guide',
	description:
		'Progressive enhancement first form validaition library for Remix and React Router',
});

export function CatchBoundary() {
	const caught = useCatch();

	return (
		<html>
			<head>
				<title>Oops!</title>
				<Meta />
				<Links />
			</head>
			<body className="font-['Ubuntu','sans-serif'] antialiased bg-zinc-900 text-white flex flex-col h-screen items-center justify-center p-4">
				<h1 className="text-3xl font-medium tracking-wider">
					{caught.status} {caught.statusText}
				</h1>
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	const colorScheme = useColorScheme();
	const mobileNavigation = useMobileNavigation();

	return (
		<html
			lang="en"
			className={clsx({
				dark: colorScheme === 'dark',
				'overflow-hidden': mobileNavigation.isOpen,
			})}
			suppressHydrationWarning
		>
			<head>
				<ColorSchemeScript />
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="bg-white antialiased dark:bg-zinc-900">
				<Outlet />
				<MobileNavigation />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
