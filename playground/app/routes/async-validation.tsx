import {
	type Intent,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react';
import { conformZodMessage, parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

function createSchema(
	intent: Intent | null,
	constraints: {
		isEmailUnique?: (email: string) => Promise<boolean>;
	} = {},
) {
	return z.object({
		email: z
			.email({
				error: (issue) => {
					if (issue.input === undefined) {
						return { message: 'Email is required' };
					}
					return { message: 'Email is invalid' };
				},
			})
			// check another schema so it runs only if it is a valid email
			.check((ctx) => {
				if (ctx.issues.length > 0) {
					return;
				}

				if (
					intent &&
					(intent.type !== 'validate' || intent.payload.name !== 'email')
				) {
					ctx.issues.push({
						code: 'custom',
						message: conformZodMessage.VALIDATION_SKIPPED,
						input: ctx.value,
					});
					return;
				}

				if (typeof constraints.isEmailUnique !== 'function') {
					ctx.issues.push({
						code: 'custom',
						message: conformZodMessage.VALIDATION_UNDEFINED,
						input: ctx.value,
						fatal: true,
					});
					return;
				}

				return constraints.isEmailUnique(ctx.value).then((isUnique) => {
					if (!isUnique) {
						ctx.issues.push({
							code: 'custom',
							message: 'Email is already used',
							input: ctx.value,
						});
					}
				});
			}),
		title: z
			.string({ message: 'Title is required' })
			.max(20, 'Title is too long'),
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
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

	return json(submission.reply());
}

export default function EmployeeForm() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate: !noClientValidate
			? ({ formData }) =>
					parseWithZod(formData, {
						schema: (intent) => createSchema(intent),
					})
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Employee Form" result={lastResult}>
				<Field label="Email" meta={fields.email}>
					<input
						{...getInputProps(fields.email, { type: 'email' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Title" meta={fields.title}>
					<input {...getInputProps(fields.title, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
