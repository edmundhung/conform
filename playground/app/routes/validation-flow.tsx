import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z
	.object({
		email: z.string({ message: 'Email is required' }).email('Email is invalid'),
	})
	.and(
		z
			.object({
				password: z
					.string({ message: 'Password is required' })
					.min(8, 'Password is too short'),
				confirmPassword: z.string({
					message: 'Confirm password is required',
				}),
			})
			.refine((data) => data.password === data.confirmPassword, {
				message: 'Password does not match',
				path: ['confirmPassword'],
			}),
	);

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const search = z.object({
		noClientValidate: z.preprocess((value) => value === 'yes', z.boolean()),
		showInputWithNoName: z.preprocess((value) => value === 'yes', z.boolean()),
		shouldValidate: z.enum(['onSubmit', 'onBlur', 'onInput']).optional(),
		shouldRevalidate: z.enum(['onSubmit', 'onBlur', 'onInput']).optional(),
	});

	return json(search.parse(Object.fromEntries(url.searchParams)));
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	if (
		submission.status === 'success' &&
		submission.value.email === 'test@email.registered'
	) {
		return json(
			submission.reply({
				fieldErrors: {
					email: ['Email is already registered'],
				},
			}),
		);
	}

	return json(submission.reply());
}

export default function ValidationFlow() {
	const {
		noClientValidate,
		shouldValidate,
		shouldRevalidate,
		showInputWithNoName,
	} = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		shouldValidate,
		shouldRevalidate,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Validation Flow" result={lastResult}>
				<Field label="Email" meta={fields.email}>
					<input {...getInputProps(fields.email, { type: 'email' })} />
				</Field>
				<Field label="Password" meta={fields.password}>
					<input {...getInputProps(fields.password, { type: 'password' })} />
				</Field>
				<Field label="Confirm password" meta={fields.confirmPassword}>
					<input
						{...getInputProps(fields.confirmPassword, {
							type: 'password',
						})}
					/>
				</Field>
				{showInputWithNoName ? (
					<Field label="Input with no name">
						<input type="text" name="" />
					</Field>
				) : null}
			</Playground>
		</Form>
	);
}
