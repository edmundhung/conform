import {
	conform,
	hasError,
	parse,
	shouldValidate,
	useForm,
} from '@conform-to/react';
import { formatError, validate } from '@conform-to/zod';
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

type Schema = z.infer<typeof schema>;

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);
	const serverSchema = schema.refine(
		async (employee) => {
			if (!shouldValidate(submission, 'email')) {
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
	);

	try {
		await serverSchema.parseAsync(submission.value);
	} catch (error) {
		submission.error.push(...formatError(error));
	}

	return json(submission);
};

export default function EmployeeForm() {
	const config = useLoaderData();
	const state = useActionData();
	const [form, { name, email, title }] = useForm<Schema>({
		...config,
		state,
		onValidate({ formData }) {
			return validate(formData, schema);
		},
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (
							submission.type === 'validate' &&
							(submission.intent !== 'email' ||
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
