import { useLayoutEffect } from 'react';

export function formatTitle(text: string): string {
	return `${text.slice(0, 1).toUpperCase()}${text.slice(1).toLowerCase()}`;
}

export function notFound() {
	return new Response('Not found', { status: 404, statusText: 'Not Found' });
}

export function remToPx(remValue: number) {
	let rootFontSize =
		typeof document === 'undefined'
			? 20
			: parseFloat(window.getComputedStyle(document.documentElement).fontSize);

	return remValue * rootFontSize;
}

export const useSSRSafeLayoutEffect =
	typeof document === 'undefined' ? () => {} : useLayoutEffect;
