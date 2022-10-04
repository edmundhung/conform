import { parse, setFormError } from '@conform-to/react';
import {
	ifNonEmptyString,
	getError,
	getFieldsetConstraint,
} from '@conform-to/zod';
import { z } from 'zod';
import { action, Playground, Form } from '~/playground';
import { PaymentFieldset, StudentFieldset } from '~/fieldset';

export { action };

export default function ZodIntegration() {
	const studentSchema = z.object({
		name: z
			.string()
			.min(8)
			.max(20)
			.regex(/^[0-9a-zA-Z]{8,20}$/),
		remarks: z.string().optional(),
		score: z.preprocess(
			ifNonEmptyString(Number),
			z.number().min(0).max(100).step(0.5).optional(),
		),
		grade: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).default('F'),
	});
	const paymentSchema = z.object({
		account: z.string(),
		amount: z.preprocess(ifNonEmptyString(Number), z.number()),
		timestamp: z.preprocess(
			ifNonEmptyString((value) => new Date(value)),
			z.date(),
		),
		verified: z.preprocess(
			ifNonEmptyString((value) => value === 'Yes'),
			z.boolean(),
		),
	});
	const parseFormState = (formData: FormData, schema: z.ZodTypeAny) => {
		const state = parse(formData);
		const result = schema.safeParse(state.value);

		if (result.success) {
			return {
				...state,
				value: result.data,
			};
		} else {
			return {
				...state,
				error: state.error.concat(getError(result.error)),
			};
		}
	};
	const createValidate =
		(schema: z.ZodTypeAny) => (formData: FormData, form: HTMLFormElement) => {
			const formState = parseFormState(formData, schema);

			setFormError(form, formState.error);
		};

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the zod schema"
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
