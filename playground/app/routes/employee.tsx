import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field, Alert } from '~/components';
import { parseConfig } from '~/config';

function createSchema(
	intent: string,
	constraints: {
		isEmailUsed?: (email: string) => Promise<boolean>;
	} = {},
) {
	return z.object({
		name: z.string().min(1, 'Name is required'),
		email: z
			.string()
			.min(1, 'Email is required')
			.email('Email is invalid')
			.superRefine((value, ctx) => {
				let message = '';

				if (intent !== 'validate/email' && intent !== 'submit') {
					message = '__SKIPPED__';
				} else if (typeof constraints.isEmailUsed === 'undefined') {
					message = '__UNDEFINED__';
				} else {
					return constraints.isEmailUsed(value).then((valid) => {
						if (!valid) {
							return;
						}

						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: 'Email is already used',
						});
					});
				}

				if (message) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message,
					});
				}
			}),
		title: z.string().min(1, 'Title is required').max(20, 'Title is too long'),
	});
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = await parse(formData, {
		schema: (intent) =>
			createSchema(intent, {
				isEmailUsed(email) {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(email !== 'hey@conform.guide');
						}, Math.random() * 500);
					});
				},
			}),
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
			return parse(formData, {
				schema: (intent) => createSchema(intent),
			});
		},
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
