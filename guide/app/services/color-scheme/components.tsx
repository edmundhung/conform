import { useState } from 'react';
import { useRouteLoaderData, useTransition } from '@remix-run/react';
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
