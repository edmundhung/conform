import { resolve, ifNonEmptyString } from '@conform-to/zod';
import { z } from 'zod';
import { action, Playground, Form } from '~/playground';
import { PaymentFieldset, StudentFieldset } from '~/fieldset';

export { action };

export default function ZodIntegration() {
	const studentSchema = resolve(
		z.object({
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
		}),
	);
	const paymentSchema = resolve(
		z.object({
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
		}),
	);

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the zod schema"
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
