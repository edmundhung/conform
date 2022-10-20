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
				if (submission.type !== 'validate' || submission.metadata === 'email') {
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

			if (!result.success) {
				submission.error = submission.error.concat(getError(result.error));
			}

			if (config.mode === 'server-validation') {
				if (
					(submission.type !== 'validate' || submission.metadata === 'email') &&
					!hasError(submission.error, 'email')
				) {
					return true;
				}
			}

			return reportValidity(form, submission);
		},
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (
							submission.type === 'validate' &&
							submission.metadata !== 'email'
						) {
							event.preventDefault();
						}
				  }
				: undefined,
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
