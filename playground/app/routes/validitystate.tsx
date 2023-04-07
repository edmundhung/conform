import {
	type Control,
	parse,
	validate,
	formatValidationMessage,
	formatValidity as defaultFormat,
} from '@conform-to/validitystate';
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Playground, Field } from '~/components';

function getSchema(url: URL) {
	if (url.searchParams.has('schema')) {
		return JSON.parse(url.searchParams.get('schema') as string);
	}

	return {};
}

function getSecret(url: URL) {
	return url.searchParams.get('secret');
}

function createFormatValidity(secret: string | null) {
	return (control: Control, value: Partial<{ field: any }>): string[] => {
		const messages = defaultFormat(control);

		if (
			secret !== null &&
			((value.field instanceof File &&
				value.field.name === JSON.parse(secret)) ||
				JSON.stringify(value.field) === secret)
		) {
			messages.push('secret');
		}

		return messages;
	};
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return json({
		schema: getSchema(url),
		secret: getSecret(url),
	});
}

export async function action({ request }: ActionArgs) {
	const url = new URL(request.url);
	const secret = getSecret(url);
	const formData = await request.formData();
	const formatValidity = createFormatValidity(secret);
	const submission = parse(formData, {
		schema: { field: getSchema(url) },
		formatValidity,
	});

	return json(submission);
}

export default function Example() {
	const { schema, secret } = useLoaderData<typeof loader>();
	const submission = useActionData<typeof action>();
	const [error, setError] = useState(submission?.error ?? {});
	const searchParams = new URLSearchParams([
		['schema', JSON.stringify(schema)],
	]);

	if (secret !== null) {
		searchParams.set('secret', secret);
	}

	useEffect(() => {
		if (submission?.error) {
			setError(submission.error);
		}
	}, [submission]);

	return (
		<Form
			method="post"
			encType={schema.type === 'file' ? 'multipart/form-data' : undefined}
			action={`?${searchParams}`}
			onSubmit={(event) => {
				// Reset all error
				setError({});

				validate(event.currentTarget, {
					schema: { field: schema },
					formatValidity: createFormatValidity(secret),
				});

				if (!event.currentTarget.reportValidity()) {
					event.preventDefault();
				}
			}}
			onInvalidCapture={(event) => {
				const input = event.target as
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement;

				setError((error) => ({
					...error,
					[input.name]: formatValidationMessage(input.validationMessage),
				}));
				event.preventDefault();
			}}
			noValidate
		>
			<Playground title="Validity State" lastSubmission={submission}>
				<Field label="Field" config={{ errors: error.field }}>
					{schema.type === 'checkbox' || schema.type === 'radio' ? (
						<input
							name="field"
							defaultChecked={
								(schema.value ?? 'on') === submission?.payload.field
							}
							{...schema}
						/>
					) : schema.type === 'select' ? (
						<select
							name="field"
							defaultValue={submission?.payload.field ?? ''}
							{...schema}
						>
							{schema.multiple ? null : (
								<option value="">Select an option</option>
							)}
							<option value="a">Option A</option>
							<option value="b">Option B</option>
							<option value="c">Option C</option>
						</select>
					) : schema.type === 'textarea' ? (
						<textarea
							name="field"
							defaultValue={submission?.payload.field ?? ''}
							{...schema}
						/>
					) : (
						<input
							name="field"
							defaultValue={submission?.payload.field ?? ''}
							{...schema}
						/>
					)}
				</Field>
			</Playground>
		</Form>
	);
}
