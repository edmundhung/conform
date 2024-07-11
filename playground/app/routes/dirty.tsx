import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string(),
	email: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(
		submission.reply({
			fieldErrors: {
				name: ['Something went wrong'],
			},
		}),
	);
}

const defaults = {
	name: 'Full Name',
	email: 'test@example.com',
};

export default function Dirty() {
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		constraint: getZodConstraint(schema),
		shouldValidate: 'onBlur',
		defaultValue: {
			name: defaults.name,
			email: defaults.email,
		},
		onValidate: ({ formData }) => parseWithZod(formData, { schema }),
		shouldDirtyConsider: (name) => {
			return name !== 'email';
		},
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Template Form" result={lastResult}>
				<Field label="Name" meta={fields.name}>
					<input {...getInputProps(fields.name, { type: 'text' })} />
				</Field>
				<Field label="Email" meta={fields.email}>
					<input {...getInputProps(fields.email, { type: 'email' })} disabled />
				</Field>

				<p>
					is dirty:{' '}
					<span data-testid="is-dirty">{form.dirty ? 'true' : 'false'}</span>
				</p>
			</Playground>
		</Form>
	);
}
