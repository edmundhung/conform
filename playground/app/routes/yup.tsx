import { parse, resolve } from '@conform-to/yup';
import { action, Playground, Form } from '~/playground';
import { StudentFieldset } from '~/fieldset';
import * as yup from 'yup';

export { action };

export default function YupIntegration() {
	const StudentSchema = yup.object({
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

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the yup schema"
				parse={(payload) => parse(payload, StudentSchema)}
				form="native"
			>
				<Form id="native" method="post">
					<StudentFieldset schema={resolve(StudentSchema)} />
				</Form>
			</Playground>
		</>
	);
}
