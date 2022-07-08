import { parse } from '@conform-to/zod';
import { useFormAction, useMatches } from '@remix-run/react';
import { z } from 'zod';

const FormConfigSchema = z.object({
	initialReport: z.enum(['onSubmit', 'onBlur', 'onChange']).optional(),
	noValidate: z.preprocess((value) => {
		if (typeof value === 'undefined') {
			return;
		}

		return true;
	}, z.boolean().optional()),
	fallbackNative: z.preprocess((value) => {
		if (typeof value === 'undefined') {
			return;
		}

		return true;
	}, z.boolean().optional()),
});

export type FormConfig = z.infer<typeof FormConfigSchema>;

export function getFormConfig(searchParams: URLSearchParams) {
	const result = parse(searchParams, FormConfigSchema);

	if (result.state !== 'accepted') {
		throw new Response('Bad request', { status: 400 });
	}

	return result.value;
}

export function useFormConfig(): [FormConfig, string] {
	const action = useFormAction();
	const matches = useMatches();
	const root = matches.find((match) => match.id === 'root');
	const config: FormConfig = root?.data ?? {};
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(config)) {
		if (value) {
			searchParams.set(key, typeof value === 'string' ? value : '');
		}
	}

	return [config, `${action}?${searchParams}`];
}
