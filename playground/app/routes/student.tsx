import type { Submission } from '@conform-to/react';
import {
	conform,
	useFieldset,
	useForm,
	parse,
	reportValidity,
} from '@conform-to/react';
import { getFieldsetConstraint, getError } from '@conform-to/yup';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import * as yup from 'yup';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

const schema = yup.object({
	name: yup
		.string()
		.min(8)
		.max(20)
		.matches(/^[0-9a-zA-Z]{8,20}$/)
		.required(),
	remarks: yup.string().required().optional(),
	score: yup.number().min(0).max(100),
	grade: yup.string().oneOf(['A', 'B', 'C', 'D', 'E', 'F']).default('F'),
});

type Schema = yup.InferType<typeof schema>;

function validate(submission: Submission<Schema>): Submission<Schema> {
	try {
		schema.validateSync(submission.value, {
			abortEarly: false,
		});
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			submission.error = submission.error.concat(getError(error));
		} else {
			submission.error = submission.error.concat([['', 'Validation failed']]);
		}
	}

	return submission;
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);

	return validate(submission);
};

export default function StudentForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Schema>({
		...config,
		state,
		onValidate: config.validate
			? ({ form, submission }) => {
					const state = validate(submission);

					return reportValidity(form, state.error);
			  }
			: undefined,
		onSubmit(event, { submission }) {
			switch (submission.type) {
				case 'validate': {
					event.preventDefault();
					break;
				}
			}
		},
	});
	const { name, remarks, grade, score } = useFieldset(form.ref, {
		...form.config,
		constraint: getFieldsetConstraint(schema),
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Student Form" state={state}>
				<fieldset>
					<Field label="Name" error={name.error}>
						<input {...conform.input(name.config, { type: 'text' })} />
					</Field>
					<Field label="Remarks" error={remarks.error}>
						<input {...conform.input(remarks.config, { type: 'text' })} />
					</Field>
					<Field label="Score" error={score.error}>
						<input {...conform.input(score.config, { type: 'number' })} />
					</Field>
					<Field label="Grade" error={grade.error}>
						<input {...conform.input(grade.config, { type: 'text' })} />
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
