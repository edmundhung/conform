import { conform, parse, useForm } from '@conform-to/react';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';

interface Schema {
	singleChoice: string;
	multipleChoice: string;
}

function parseForm(formData: FormData) {
	return parse(formData, {
		resolve({ singleChoice, multipleChoice }) {
			const error: Record<string, string> = {};

			if (!singleChoice) {
				error.singleChoice = 'Required';
			}

			if (!multipleChoice) {
				error.multipleChoice = 'Required';
			}

			if (error.singleChoice || error.multipleChoice) {
				return { error };
			}

			return {
				value: {
					singleChoice,
					multipleChoice,
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

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, { singleChoice, multipleChoice }] = useForm<Schema>({
		id: 'collection',
		lastSubmission,
		shouldRevalidate: 'onInput',
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Collection" lastSubmission={lastSubmission}>
				<Field label="Single choice" config={singleChoice}>
					{conform
						.collection(singleChoice, {
							type: 'radio',
							options: ['x', 'y', 'z'],
							ariaAttributes: true,
						})
						.map((props) => (
							<label key={props.value} className="inline-block">
								<input {...props} />
								<span className="p-2">{props.value?.toUpperCase()}</span>
							</label>
						))}
				</Field>
				<Field label="Multiple choice" config={multipleChoice}>
					{conform
						.collection(multipleChoice, {
							type: 'checkbox',
							options: ['a', 'b', 'c', 'd'],
							ariaAttributes: true,
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
