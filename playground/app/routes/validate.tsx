import { conform, report, useForm, validate } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	message: z.string().min(1, 'Message is required'),
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

	return json(report(submission));
}

export default function Validate() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const state = useActionData();
	const [form, { name, message }] = useForm({
		mode: noClientValidate ? 'server-validation' : 'client-only',
		state,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Validate" state={state}>
				<Field label="Name" {...name}>
					<input {...conform.input(name.config, { type: 'text' })} />
				</Field>
				<Field label="Message" {...message}>
					<textarea {...conform.textarea(message.config)} />
				</Field>
				<div className="flex flex-row gap-2">
					<button
						className="rounded-md border p-2 hover:border-black"
						{...validate(name.config.name)}
					>
						Validate Name
					</button>
					<button
						className="rounded-md border p-2 hover:border-black"
						{...validate()}
					>
						Validate Form
					</button>
				</div>
			</Playground>
		</Form>
	);
}
