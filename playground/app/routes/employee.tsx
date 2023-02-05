import { conform, hasError, shouldValidate, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().min(1, 'Email is required').email('Email is invalid'),
	title: z.string().min(1, 'Title is required').max(20, 'Title is too long'),
});

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = await parse(formData, {
		schema: (intent) =>
			schema.refine(
				async (employee) => {
					if (!shouldValidate(intent, 'email')) {
						return true;
					}

					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(employee.email === 'hey@conform.guide');
						}, Math.random() * 500);
					});
				},
				{
					message: 'Email is already used',
					path: ['email'],
				},
			),
		async: true,
	});

	return json(submission);
};

export default function EmployeeForm() {
	const config = useLoaderData();
	const state = useActionData();
	const [form, { name, email, title }] = useForm({
		...config,
		state,
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (
							submission.intent !== 'submit' &&
							(submission.intent !== 'validate/email' ||
								hasError(submission.error, 'email'))
						) {
							event.preventDefault();
						}
				  }
				: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Employee Form" state={state}>
				<Alert message={form.error} />
				<Field label="Name" {...name}>
					<input
						{...conform.input(name.config, { type: 'text' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Email" {...email}>
					<input
						{...conform.input(email.config, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Title" {...title}>
					<input {...conform.input(title.config, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
