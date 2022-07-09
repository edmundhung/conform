import { type FormResult } from '@conform-to/dom';
import { parse as baseParse } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { useFormAction, useMatches } from '@remix-run/react';
import { type FormEventHandler, useState } from 'react';
import { z } from 'zod';

const FormConfigSchema = z.object({
	initialReport: z.enum(['onSubmit', 'onBlur', 'onChange']).optional(),
	noValidate: z.boolean().optional(),
	fallbackNative: z.boolean().optional(),
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

export function useFormResult(): [
	Record<string, FormResult<any> | undefined>,
	FormEventHandler<HTMLFormElement>,
	FormEventHandler<HTMLFormElement>,
] {
	const [map, setMap] = useState({});
	const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();

		const form = e.currentTarget;
		const formData = new FormData(form);
		const result = baseParse(formData);

		setMap((map) => ({
			...map,
			[form.id]: result,
		}));
	};
	const handleReset: FormEventHandler<HTMLFormElement> = (e) => {
		const form = e.currentTarget;

		setMap((map) => ({
			...map,
			[form.id]: undefined,
		}));
	};

	return [map, handleSubmit, handleReset];
}
