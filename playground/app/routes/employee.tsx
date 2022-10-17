import {
	conform,
	parse,
	useFieldset,
	useForm,
	hasError,
	reportValidity,
} from '@conform-to/react';
import { getError } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
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
	const result = await schema
		.refine(
			async (employee) => {
				if (
					(submission.type === 'validate' && submission.data === 'email') ||
					typeof submission.type === 'undefined'
				) {
					return new Promise((resolve) => {
						setTimeout(() => {
							resolve(employee.email === 'hey@conform.guide');
						}, Math.random() * 500);
					});
				}

				return true;
			},
			{
				message: 'Email is already used',
				path: ['email'],
			},
		)
		.safeParseAsync(submission.value);

	return {
		...submission,
		error: submission.error.concat(
			!result.success ? getError(result.error) : [],
		),
	};
};

export default function EmployeeForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Schema>({
		...config,
		state,
		onValidate({ form, submission }) {
			const result = schema.safeParse(submission.value);
			const error = submission.error.concat(
				!result.success ? getError(result.error) : [],
			);
			const hasEmailError = hasError(error, 'email');

			if (
				submission.type === 'validate' &&
				submission.data === 'email' &&
				!hasEmailError
			) {
				// Consider the submission to be valid
				return true;
			}

			if (typeof submission.type === 'undefined' && !hasEmailError) {
				// Consider the submission to be valid too
				return true;
			}

			/**
			 * The `reportValidity` helper does 2 things for you:
			 * (1) Set all error to the dom and trigger the `invalid` event through `form.reportValidity()`
			 * (2) Return whether the form is valid or not. If the form is invalid, stop it.
			 */
			return reportValidity(form, error);
		},
		async onSubmit(event, { submission }) {
			if (submission.type === 'validate' && submission.data !== 'email') {
				event.preventDefault();
			}
		},
	});
	const { name, email, title } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Employee Form" state={state}>
				<Alert message={form.error} />
				<Field label="Name" error={name.error}>
					<input
						{...conform.input(name.config, { type: 'text' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Email" error={email.error}>
					<input
						{...conform.input(email.config, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Title" error={title.error}>
					<input {...conform.input(title.config, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
