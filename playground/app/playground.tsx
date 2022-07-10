import { type LoaderFunction, type ActionFunction } from '@remix-run/node';
import {
	useActionData as useRemixActionData,
	useLoaderData as useRemixLoaderData,
	useFormAction,
} from '@remix-run/react';
import { parse as baseParse } from '@conform-to/dom';
import { parse } from '@conform-to/zod';
import { type FormEventHandler, useState, useEffect } from 'react';
import { z } from 'zod';

const FormConfigSchema = z.object({
	initialReport: z.enum(['onSubmit', 'onBlur', 'onChange']).optional(),
	noValidate: z.boolean().optional(),
	fallbackNative: z.boolean().optional(),
});

function getFormConfig(searchParams: URLSearchParams) {
	const result = parse(searchParams, FormConfigSchema);

	if (result.state !== 'accepted') {
		throw new Response('Bad request', { status: 400 });
	}

	return result.value;
}

export let loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url);
	const config = getFormConfig(url.searchParams);

	return config;
};

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const form = formData.get('playground');

	if (form) {
		formData.delete('playground');
	}

	return {
		form,
		entries: Array.from(formData),
	};
};

export function useActionData() {
	const config = useRemixLoaderData();
	const actionData = useRemixActionData();
	const action = useFormAction();
	const [formDataById, setFormDataById] = useState<
		Record<string, URLSearchParams | undefined>
	>({});
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(config)) {
		if (value) {
			searchParams.set(key, typeof value === 'string' ? value : '');
		}
	}

	const handleReset: FormEventHandler<HTMLFormElement> = (e) => {
		const form = e.currentTarget;

		setFormDataById((map) => ({
			...map,
			[form.id]: undefined,
		}));
	};

	useEffect(() => {
		if (!actionData) {
			return;
		}

		const { form, entries } = actionData;

		setFormDataById((map) => {
			if (map[form] === entries) {
				return map;
			}

			return {
				...map,
				[form]: entries,
			};
		});
	}, [actionData]);

	return {
		getResult(form: string, parse = baseParse) {
			const payload = formDataById[form];

			if (!payload) {
				return;
			}

			const formData = new URLSearchParams(payload);
			const result = parse(formData);

			return result;
		},
		config: {
			...actionData?.config,
			onReset: handleReset,
		},
		action: `${action}?${searchParams}`,
	};
}
