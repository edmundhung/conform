import { useForm, conform } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect } from 'react';
import { z } from 'zod';
import { Field, Playground } from '~/components';

const schema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		code: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'The code is invalid'),
	})
	.refine(
		(data) => colors.find((c) => c.name === data.name && c.code === data.code),
		{
			message: 'The color is invalid',
			path: ['code'],
		},
	);

const colors = [
	{
		name: 'Red',
		code: '#ff0000',
	},
	{
		name: 'Green',
		code: '#00ff00',
	},
	{
		name: 'Blue',
		code: '#0000ff',
	},
];

export let loader = async ({ request }: ActionArgs) => {
	const url = new URL(request.url);
	const color = url.searchParams.get('color');
	// This is used to confirm the original approach on clearing the submission is working
	const shouldClearSubmission =
		url.searchParams.get('shouldClearSubmission') === 'yes';

	return json({
		color,
		defaultValue: colors.find((c) => color === c.name.toLowerCase()),
		shouldClearSubmission,
	});
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema,
	});

	if (!submission.value || submission.intent !== 'submit') {
		return json(submission);
	}

	// We can also skip sending the submission back to the client on success
	// As the form value shuold be reset anyway
	return json({
		...submission,
		payload: null,
	});
};

export default function ExampleForm() {
	const { color, defaultValue, shouldClearSubmission } =
		useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, fieldset] = useForm({
		defaultValue,
		lastSubmission: shouldClearSubmission
			? lastSubmission?.payload === null
				? null
				: lastSubmission
			: lastSubmission,
	});

	useEffect(() => {
		form.ref.current?.reset();
	}, [form.ref, color]);

	return (
		<Form method="post" {...form.props}>
			<Playground
				title="Payment Form"
				description={
					<div>
						Please choose a color
						<ul>
							<li>
								<Link
									className="text-red-600"
									to={`?color=red&shouldClearSubmission=${
										shouldClearSubmission ? 'yes' : 'no'
									}`}
								>
									Red
								</Link>
							</li>
							<li>
								<Link
									className="text-green-600"
									to={`?color=green&shouldClearSubmission=${
										shouldClearSubmission ? 'yes' : 'no'
									}`}
								>
									Green
								</Link>
							</li>
							<li>
								<Link
									className="text-blue-600"
									to={`?color=blue&shouldClearSubmission=${
										shouldClearSubmission ? 'yes' : 'no'
									}`}
								>
									Blue
								</Link>
							</li>
						</ul>
					</div>
				}
				lastSubmission={lastSubmission}
			>
				<Field label="Name" config={fieldset.name}>
					<input {...conform.input(fieldset.name, { type: 'text' })} />
				</Field>
				<Field label="Code" config={fieldset.code}>
					<input {...conform.input(fieldset.code, { type: 'color' })} />
				</Field>
			</Playground>
		</Form>
	);
}
