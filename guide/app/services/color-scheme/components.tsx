import { useState } from 'react';
import {
	Form,
	useLocation,
	useRouteLoaderData,
	useTransition,
} from '@remix-run/react';
import { useSSRSafeLayoutEffect } from '~/util';
import { type ColorScheme } from './types';
import { parseFormData } from './server';

export function useColorScheme(): ColorScheme {
	const rootLoaderData = useRouteLoaderData('root') as {
		colorScheme: ColorScheme;
	};
	const { submission } = useTransition();
	const optimisticColorScheme =
		submission && submission.formData.has('colorScheme')
			? parseFormData(submission.formData).colorScheme
			: null;

	return optimisticColorScheme || rootLoaderData.colorScheme;
}

export function ColorSchemeScript() {
	const colorScheme = useColorScheme();
	const [script] = useState(`
    let colorScheme = ${JSON.stringify(colorScheme)};
    if (colorScheme === "system") {
      let media = window.matchMedia("(prefers-color-scheme: dark)")
      if (media.matches) document.documentElement.classList.add("dark");
    }
  `);

	useSSRSafeLayoutEffect(() => {
		function disableTransitionsTemporarily() {
			document.documentElement.classList.add('[&_*]:!transition-none');

			return () => {
				document.documentElement.classList.remove('[&_*]:!transition-none');
			};
		}

		const enableTransitions = disableTransitionsTemporarily();
		const timeout = setTimeout(enableTransitions, 0);

		if (colorScheme === 'light') {
			document.documentElement.classList.remove('dark');
		} else if (colorScheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (colorScheme === 'system') {
			const media = window.matchMedia('(prefers-color-scheme: dark)');

			function check(media: MediaQueryList) {
				if (media.matches) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}

			function handleMediaChange(this: MediaQueryList) {
				check(this);
			}

			check(media);

			media.addEventListener('change', handleMediaChange);

			return () => {
				clearTimeout(timeout);
				enableTransitions();
				media.removeEventListener('change', handleMediaChange);
			};
		} else {
			console.error('Impossible color scheme state:', colorScheme);
		}
	}, [colorScheme]);

	return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
			<path
				strokeLinecap="round"
				d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
			/>
		</svg>
	);
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
			<path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
		</svg>
	);
}

export function ColorSchemeSwitcher() {
	const location = useLocation();

	return (
		<Form method="post" action="/color-scheme" replace>
			<input
				type="hidden"
				name="returnTo"
				value={location.pathname + location.search}
			/>
			<button
				className="dark:hidden flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
				aria-label="Toggle dark mode"
				name="colorScheme"
				value="dark"
			>
				<SunIcon className="h-5 w-5 stroke-zinc-900" />
			</button>
			<button
				className="hidden dark:flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
				aria-label="Toggle dark mode"
				name="colorScheme"
				value="light"
			>
				<MoonIcon className="h-5 w-5 stroke-white" />
			</button>
		</Form>
	);
}
