import { createCookie } from '@remix-run/cloudflare';
import { type ColorScheme } from './types';

const cookie = createCookie('color-scheme', {
	maxAge: 34560000,
	sameSite: 'lax',
});

export async function parseColorScheme(request: Request) {
	const header = request.headers.get('Cookie');
	const vals = await cookie.parse(header);
	const colorScheme = vals?.colorScheme;

	return validateColorScheme(colorScheme) ? colorScheme : 'system';
}

export function serializeColorScheme(colorScheme: ColorScheme) {
	const eatCookie = colorScheme === 'system';

	if (eatCookie) {
		return cookie.serialize({}, { expires: new Date(0), maxAge: 0 });
	} else {
		return cookie.serialize({ colorScheme });
	}
}

export function parseFormData(formData: FormData) {
	const colorScheme = formData.get('colorScheme');
	const returnTo = formData.get('returnTo');

	return {
		colorScheme: validateColorScheme(colorScheme) ? colorScheme : null,
		returnTo: safeRedirect(returnTo),
	};
}

function validateColorScheme(formValue: any): formValue is ColorScheme {
	return (
		formValue === 'dark' || formValue === 'light' || formValue === 'system'
	);
}

function safeRedirect(to: FormDataEntryValue | string | null | undefined) {
	if (!to || typeof to !== 'string') {
		return '/';
	}

	if (!to.startsWith('/') || to.startsWith('//')) {
		return '/';
	}

	return to;
}
