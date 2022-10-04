import { getError, getFieldsetConstraint } from '@conform-to/yup';
import { parse, setFormError } from '@conform-to/react';
import { action, Playground, Form } from '~/playground';
import { PaymentFieldset, StudentFieldset } from '~/fieldset';
import * as yup from 'yup';

export { action };

export default function YupIntegration() {
	const studentSchema = yup.object({
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
	const paymentSchema = yup.object({
		account: yup.string().required(),
		amount: yup.number().required(),
		timestamp: yup.date().required(),
		verified: yup
			.boolean()
			.transform((value) => value === 'Yes')
			.required(),
	});
	const parseFormState = (formData: FormData, schema: yup.AnyObjectSchema) => {
		const state = parse(formData);

		try {
			state.value = schema.validateSync(state.value, {
				abortEarly: false,
			});
		} catch (error) {
			if (error instanceof yup.ValidationError) {
				state.error = state.error.concat(getError(error));
			} else {
				state.error = state.error.concat([['_', 'Validation failed']]);
			}
		}

		return state;
	};
	const createValidate =
		(schema: yup.AnyObjectSchema) =>
		(formData: FormData, form: HTMLFormElement) => {
			const formState = parseFormState(formData, schema);

			setFormError(form, formState.error);
		};

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the yup schema"
				parse={(formData) => parseFormState(formData, studentSchema)}
				form="native"
			>
				<Form
					id="native"
					method="post"
					validate={createValidate(studentSchema)}
				>
					<StudentFieldset constraint={getFieldsetConstraint(studentSchema)} />
				</Form>
			</Playground>
			<Playground
				title="Type Conversion"
				description="Parsing the form data based on the defined preprocess with zod"
				parse={(formData) => parseFormState(formData, paymentSchema)}
				form="type"
			>
				<Form id="type" method="post" validate={createValidate(paymentSchema)}>
					<PaymentFieldset constraint={getFieldsetConstraint(paymentSchema)} />
				</Form>
			</Playground>
		</>
	);
}
