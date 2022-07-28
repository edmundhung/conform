import { Form } from '@remix-run/react';
import { parse, resolve } from '@conform-to/zod';
import { z } from 'zod';
import { action, Playground } from '~/playground';
import { PaymentFieldset, StudentFieldset } from '~/fieldset';

export { action };

export default function ZodIntegration() {
	const StudentSchema = z.object({
		name: z
			.string()
			.min(8)
			.max(20)
			.regex(/^[0-9a-zA-Z]{8,20}$/),
		remarks: z.string().optional(),
		score: z.preprocess(
			(value) => (typeof value !== 'undefined' ? Number(value) : undefined),
			z.number().min(0).max(100).step(0.5).optional(),
		),
		grade: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).default('F'),
	});
	const paymentSchema = z.object({
		account: z.string(),
		amount: z.preprocess(
			(value) => (typeof value !== 'undefined' ? Number(value) : value),
			z.number(),
		),
		timestamp: z.preprocess(
			(value) =>
				typeof value !== 'undefined' ? new Date(value as any) : value,
			z.date(),
		),
		verified: z.preprocess(
			(value) => (typeof value !== 'undefined' ? value === 'Yes' : value),
			z.boolean(),
		),
	});

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the zod schema"
				parse={(payload) => parse(payload, StudentSchema)}
				form="native"
			>
				<Form id="native" method="post">
					<StudentFieldset schema={resolve(StudentSchema)} />
				</Form>
			</Playground>
			<Playground
				title="Type Conversion"
				description="Parsing the form data based on the defined preprocess with zod"
				parse={(payload) => parse(payload, paymentSchema)}
				form="type"
			>
				<Form id="type" method="post">
					<PaymentFieldset schema={resolve(paymentSchema)} />
				</Form>
			</Playground>
		</>
	);
}
