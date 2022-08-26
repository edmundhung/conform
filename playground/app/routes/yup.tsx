import { resolve } from '@conform-to/yup';
import { action, Playground, Form } from '~/playground';
import { PaymentFieldset, StudentFieldset } from '~/fieldset';
import * as yup from 'yup';

export { action };

export default function YupIntegration() {
	const studentSchema = resolve(
		yup.object({
			name: yup
				.string()
				.min(8)
				.max(20)
				.matches(/^[0-9a-zA-Z]{8,20}$/)
				.required(),
			remarks: yup.string().required().optional(),
			score: yup.number().min(0).max(100),
			grade: yup.string().oneOf(['A', 'B', 'C', 'D', 'E', 'F']).default('F'),
		}),
	);
	const paymentSchema = resolve(
		yup.object({
			account: yup.string().required(),
			amount: yup.number().required(),
			timestamp: yup.date().required(),
			verified: yup
				.boolean()
				.transform((value) => value === 'Yes')
				.required(),
		}),
	);

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the yup schema"
				parse={studentSchema.parse}
				form="native"
			>
				<Form id="native" method="post" validate={studentSchema.validate}>
					<StudentFieldset constraint={studentSchema.constraint} />
				</Form>
			</Playground>
			<Playground
				title="Type Conversion"
				description="Parsing the form data based on the defined preprocess with zod"
				parse={paymentSchema.parse}
				form="type"
			>
				<Form id="type" method="post" validate={paymentSchema.validate}>
					<PaymentFieldset constraint={paymentSchema.constraint} />
				</Form>
			</Playground>
		</>
	);
}
