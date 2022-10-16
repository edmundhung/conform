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
				if (!submission.scope.includes('email')) {
					return true;
				}

				return new Promise((resolve) => {
					setTimeout(() => {
						resolve(employee.email === 'hey@conform.guide');
					}, Math.random() * 100);
				});
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
			!result.success ? getError(result.error, submission.scope) : [],
		),
	};
};

export default function EmployeeForm() {
	const config = useLoaderData();
	const status = useActionData();
	const form = useForm<Schema>({
		...config,
		status,
		onValidate({ form, submission }) {
			const result = schema.safeParse(submission.value);
			const error = submission.error.concat(
				!result.success ? getError(result.error) : [],
			);

			if (submission.scope.includes('email') && !hasError(error, 'email')) {
				// Skip reporting client validation result
				return true;
			}

			return reportValidity(form, {
				...submission,
				error,
			});
		},
		async onSubmit(event, { submission }) {
			switch (submission.type) {
				case 'validate': {
					if (submission.data !== 'email') {
						event.preventDefault();
					}
					break;
				}
			}
		},
	});
	const { name, email, title } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Employee Form" status={status}>
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
