import { conform, useForm } from '@conform-to/react';
import { parse, refine } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

function createSchema(
	intent: string,
	constraints: {
		isEmailUnique?: (email: string) => Promise<boolean>;
	} = {},
) {
	return z.object({
		email: z
			.string()
			.min(1, 'Email is required')
			.email('Email is invalid')
			.superRefine((email, ctx) =>
				refine(ctx, {
					validate: () => constraints.isEmailUnique?.(email),
					when: intent === 'validate/email' || intent === 'submit',
					message: 'Email is already used',
				}),
			),
		title: z.string().min(1, 'Title is required').max(20, 'Title is too long'),
	});
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = await parse(formData, {
		schema: (intent) =>
			createSchema(intent, {
				isEmailUnique(email) {
					return new Promise((resolve) => {
						setTimeout(() => {
							// Only `hey@conform.guide` is unique
							resolve(email === 'hey@conform.guide');
						}, Math.random() * 500);
					});
				},
			}),
		async: true,
	});

	return json(submission);
}

export default function EmployeeForm() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { email, title }] = useForm({
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) =>
					parse(formData, {
						schema: (intent) => createSchema(intent),
					})
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Employee Form" lastSubmission={lastSubmission}>
				<Field label="Email" config={email}>
					<input
						{...conform.input(email, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Title" config={title}>
					<input {...conform.input(title, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
