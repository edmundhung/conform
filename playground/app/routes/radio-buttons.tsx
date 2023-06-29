import { conform, parse, useForm } from '@conform-to/react';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { Playground, Field } from '~/components';

interface Schema {
	answer: string;
}

function parseForm(formData: FormData) {
	return parse(formData, {
		resolve({ answer }) {
			const error: Record<string, string> = {};

			if (!answer) {
				error.answer = 'Required';
			}

			if (error.answer) {
				return { error };
			}

			return {
				value: {
					answer,
				},
			};
		},
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
	const submission = parseForm(formData);

	return json(submission);
}

const options = {
	a: 'A',
	b: 'B',
	c: 'C',
	d: 'D',
};

export default function Example() {
	const id = useId();
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { answer }] = useForm<Schema>({
		id,
		lastSubmission,
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Attributes" lastSubmission={lastSubmission}>
				<Field label="Multiple Choice" config={answer}>
					{conform
						.collection(answer, {
							type: 'radio',
							values: Object.keys(options),
						})
						.map((option) => (
							<label className="inline-block" key={option.id}>
								<input {...option} />
								<span className="p-2">
									{options[option.value as keyof typeof options]}
								</span>
							</label>
						))}
				</Field>
			</Playground>
		</Form>
	);
}
