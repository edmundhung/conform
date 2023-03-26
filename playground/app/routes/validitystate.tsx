import { validate, getMessages } from '@conform-to/validitystate';
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Playground, Field } from '~/components';

function getSchema(request: Request) {
	const url = new URL(request.url);

	if (url.searchParams.has('schema')) {
		return JSON.parse(url.searchParams.get('schema') as string);
	}

	return {};
}

export async function loader({ request }: LoaderArgs) {
	return json({
		schema: getSchema(request),
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = validate(formData, { field: getSchema(request) } as any);

	return json(submission);
}

export default function Example() {
	const { schema } = useLoaderData();
	const submission = useActionData<typeof action>();
	const [error, setError] = useState(submission?.error ?? {});

	useEffect(() => {
		if (submission?.error) {
			setError(submission.error);
		}
	}, [submission]);

	return (
		<Form
			method="post"
			encType={schema.type === 'file' ? 'multipart/form-data' : undefined}
			action={`?schema=${JSON.stringify(schema)}`}
			onSubmit={(event) => {
				// Reset all error
				setError({});

				if (!event.currentTarget.reportValidity()) {
					event.preventDefault();
				}
			}}
			onInvalidCapture={(event) => {
				const input = event.target as
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement;
				const messages = getMessages(input.validity);

				setError((error) => ({
					...error,
					[input.name]: messages,
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
							<option value="">Select an option</option>
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
