import { conform, parse, useForm, validate } from '@conform-to/react';
import { formatError, validate as validateSchema } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';

const schema = z.object({
	email: z.string().email(),
	message: z
		.string()
		.min(10, 'Min 10 characters')
		.max(100, 'Max 100 characters'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		switch (submission.type) {
			case 'validate':
			case 'submit':
				schema.parse(submission.value);
				break;
		}
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
}

export default function Validate() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData();
	const [form, { email, message }] = useForm<z.infer<typeof schema>>({
		mode: noClientValidate ? 'server-validation' : 'client-only',
		state,
		onValidate: !noClientValidate
			? ({ formData }) => validateSchema(formData, schema)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Validate" state={state}>
				<Alert message={form.error} />
				<Field label="Email" {...email}>
					<input {...conform.input(email.config, { type: 'email' })} />
				</Field>
				<Field label="Message" {...message}>
					<textarea {...conform.textarea(message.config)} />
				</Field>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...validate(email.config.name)}
					>
						Validate email
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...validate()}
					>
						Validate form
					</button>
				</div>
			</Playground>
		</Form>
	);
}
