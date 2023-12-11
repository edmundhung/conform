import {
	useForm,
	intent,
	getFormProps,
	getInputProps,
	getTextareaProps,
	getControlButtonProps,
} from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string({ required_error: 'Name is required' }),
	message: z.string({ required_error: 'Message is required' }),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (!submission.value) {
		return json(submission.reject());
	}

	return json(submission.accept());
}

export default function Validate() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData();
	const { meta, fields } = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(meta)}>
			<Playground title="Validate" lastSubmission={lastResult}>
				<Field label="Name" config={fields.name}>
					<input {...getInputProps(fields.name, { type: 'text' })} />
				</Field>
				<Field label="Message" config={fields.message}>
					<textarea {...getTextareaProps(fields.message)} />
				</Field>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.validate(fields.name.name),
						)}
					>
						Validate Name
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...getControlButtonProps(
							meta.id,
							intent.validate(fields.message.name),
						)}
					>
						Validate Message
					</button>
				</div>
			</Playground>
		</Form>
	);
}
