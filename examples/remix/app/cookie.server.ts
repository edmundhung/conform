import { createCookie } from '@remix-run/node';

export const cookie = createCookie('form-data', {
	path: '/',
	sameSite: true,
});
