import { useForm, conform } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect } from 'react';
import { z } from 'zod';
import { Field, Playground } from '~/components';

const schema = z
	.object({
		name: z.string({ required_error: 'Name is required' }),
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

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);
	const color = url.searchParams.get('color');

	return json({
		color,
		defaultValue: colors.find((c) => color === c.name.toLowerCase()),
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, {
		schema,
	});

	if (!submission.value) {
		return json(submission.reject());
	}

	return json(submission.accept({ resetForm: true }));
}

export default function ExampleForm() {
	const { color, defaultValue } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const { form, fields } = useForm({
		lastResult,
		defaultValue,
	});

	useEffect(() => {
		document.forms.namedItem(form.id)?.reset();
	}, [form.id, color]);

	return (
		<Form method="post" {...conform.form(form)}>
			<Playground
				title="Payment Form"
				description={
					<div>
						Please choose a color
						<ul>
							<li>
								<Link className="text-red-600" to="?color=red">
									Red
								</Link>
							</li>
							<li>
								<Link className="text-green-600" to="?color=green">
									Green
								</Link>
							</li>
							<li>
								<Link className="text-blue-600" to="?color=blue">
									Blue
								</Link>
							</li>
						</ul>
					</div>
				}
				lastSubmission={lastResult}
			>
				<Field label="Name" config={fields.name}>
					<input {...conform.input(fields.name, { type: 'text' })} />
				</Field>
				<Field label="Code" config={fields.code}>
					<input {...conform.input(fields.code, { type: 'color' })} />
				</Field>
			</Playground>
		</Form>
	);
}
