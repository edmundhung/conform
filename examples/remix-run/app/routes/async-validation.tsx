import {
	conform,
	parse,
	useFieldset,
	useForm,
	hasError,
} from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().min(1, 'Email is required').email('Email is invalid'),
	title: z.string().min(1, 'Title is required').max(20, 'Title is too long'),
});

async function isEmailUnique(email: string): Promise<boolean> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(email !== 'me@edmund.dev');
		}, Math.random() * 100);
	});
}

async function createEmployee(data: z.infer<typeof schema>): Promise<void> {
	throw new Error('Not implemented');
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	try {
		const data = await schema
			.refine(
				async (employee) => {
					if (
						submission.context === 'validate' &&
						submission.intent !== 'email'
					) {
						return true;
					}

					return await isEmailUnique(employee.email);
				},
				{
					message: 'Email is already used',
					path: ['email'],
				},
			)
			.parseAsync(submission.value);

		if (submission.context === 'submit') {
			await createEmployee(data);

			return redirect('/');
		}
	} catch (error) {
		submission.error = submission.error.concat(formatError(error));
	}

	return json(submission);
}

export default function EmployeeForm() {
	const state = useActionData<typeof action>();
	const form = useForm<z.infer<typeof schema>>({
		mode: 'server-validation',
		initialReport: 'onBlur',
		state,
		onValidate({ submission }) {
			const result = schema.safeParse(submission.value);

			if (result.success) {
				return [];
			}

			return formatError(result.error);
		},
		// onSubmit will be triggered only if the submission is valid
		onSubmit(event, { submission }) {
			// Only the email field requires additional validation from the server
			// We trust the client result otherwise
			if (
				submission.context === 'validate' &&
				(submission.intent !== 'email' || hasError(submission.error, 'email'))
			) {
				event.preventDefault();
			}
		},
	});
	const { name, email, title } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<fieldset>
				<legend>{form.error}</legend>
				<label>
					<div>Name</div>
					<input
						className={name.error ? 'error' : ''}
						{...conform.input(name.config)}
					/>
					<div>{name.error}</div>
				</label>
				<label>
					<div>Email</div>
					<input
						className={email.error ? 'error' : ''}
						{...conform.input(email.config)}
					/>
					<div>{email.error}</div>
				</label>
				<label>
					<div>Title</div>
					<input
						className={title.error ? 'error' : ''}
						{...conform.input(title.config)}
					/>
					<div>{title.error}</div>
				</label>
			</fieldset>
			<button type="submit">Save</button>
		</Form>
	);
}
