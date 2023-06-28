import { type ActionArgs, redirect } from '@remix-run/cloudflare';
import {
	parseFormData,
	serializeColorScheme,
} from '~/services/color-scheme/server';

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const { colorScheme, returnTo } = parseFormData(formData);

	if (!colorScheme) {
		throw new Response('Bad Request', { status: 400 });
	}

	return redirect(returnTo || '/', {
		headers: { 'Set-Cookie': await serializeColorScheme(colorScheme) },
	});
}
