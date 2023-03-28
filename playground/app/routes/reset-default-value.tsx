import { useForm, conform } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect } from 'react';
import { z } from 'zod';
import { Field, Playground } from '~/components';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	code: z.string().regex(/^#[A-Fa-f0-9]{6}$/, 'The code is invalid'),
});

const color: Record<string, z.infer<typeof schema> | undefined> = {
	red: {
		name: 'Red',
		code: '#FF0000',
	},
	green: {
		name: 'Green',
		code: '#00FF00',
	},
	blue: {
		name: 'Blue',
		code: '#0000FF',
	},
};

export let loader = async ({ request }: ActionArgs) => {
	const url = new URL(request.url);

	return json({
		defaultValue: color[url.searchParams.get('color') ?? ''],
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

	throw new Error('Not implemented');
};

export default function TodoForm() {
	const { defaultValue } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { name, code }] = useForm<z.input<typeof schema>>({
		defaultValue,
		lastSubmission,
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
	});

	useEffect(() => {
		form.ref.current?.reset();
	}, [defaultValue, form.ref]);

	return (
		<Form method="post" {...form.props}>
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
				lastSubmission={lastSubmission}
			>
				<Field label="Name" config={name}>
					<input
						key={name.defaultValue}
						{...conform.input(name, { type: 'text' })}
					/>
				</Field>
				<Field label="Code" config={code}>
					<input
						key={code.defaultValue}
						{...conform.input(code, { type: 'color' })}
					/>
				</Field>
			</Playground>
		</Form>
	);
}
