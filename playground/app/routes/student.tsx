import type { FormState } from '@conform-to/react';
import {
	conform,
	parse,
	setFormError,
	useFieldset,
	useForm,
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

function validate(state: FormState): FormState {
	try {
		schema.validateSync(state.value, {
			abortEarly: false,
		});
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			state.error = state.error.concat(getError(error));
		} else {
			state.error = state.error.concat([['', 'Validation failed']]);
		}
	}

	return state;
}

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const state = parse(formData);

	return validate(state);
};

export default function StudentForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<yup.InferType<typeof schema>>({
		...config,
		state,
		validate: config.validate
			? (formData, form) => {
					const state = parse(formData);
					const result = validate(state);

					setFormError(form, result.error);
			  }
			: undefined,
	});
	const { name, remarks, grade, score } = useFieldset(form.ref, {
		...form.config,
		constraint: getFieldsetConstraint(schema),
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Student Form" formState={state}>
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
