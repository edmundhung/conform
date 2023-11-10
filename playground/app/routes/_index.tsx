import { ConformBoundary, conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	name: z.string({ required_error: 'Name is required' }),
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

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const form = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<ConformBoundary context={form.context}>
			<Form method="post" {...conform.form(form)}>
				<Playground title="Template Form" lastSubmission={lastResult}>
					<Field label="Name" config={form.fields.name}>
						<input {...conform.input(form.fields.name, { type: 'text' })} />
					</Field>
				</Playground>
			</Form>
		</ConformBoundary>
	);
}
