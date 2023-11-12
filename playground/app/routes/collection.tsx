import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	singleChoice: z.string({ required_error: 'Required' }),
	multipleChoice: z.string().array().min(1, 'Required'),
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
	const { form, fields } = useForm({
		id: 'collection',
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate: !noClientValidate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...conform.form(form)}>
			<Playground title="Collection" lastSubmission={lastResult}>
				<Field label="Single choice" config={fields.singleChoice}>
					{conform
						.collection(fields.singleChoice, {
							type: 'radio',
							options: ['x', 'y', 'z'],
						})
						.map((props) => (
							<label key={props.value} className="inline-block">
								<input {...props} />
								<span className="p-2">{props.value?.toUpperCase()}</span>
							</label>
						))}
				</Field>
				<Field label="Multiple choice" config={fields.multipleChoice}>
					{conform
						.collection(fields.multipleChoice, {
							type: 'checkbox',
							options: ['a', 'b', 'c', 'd'],
						})
						.map((props) => (
							<label key={props.value} className="inline-block">
								<input {...props} />
								<span className="p-2">{props.value?.toUpperCase()}</span>
							</label>
						))}
				</Field>
			</Playground>
		</Form>
	);
}
