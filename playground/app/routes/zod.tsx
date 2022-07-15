import { useFieldset, conform, useForm } from '@conform-to/react';
import { parse, resolve } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import { z } from 'zod';
import { Field, Playground } from '~/components';
import { styles } from '~/helpers';
import { loader, action, useActionData } from '~/playground';

export { loader, action };

export default function ZodIntegration() {
	const { config, action, getSubmission } = useActionData();
	const typeFormProps = useForm(config);

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Infering constraint based on the zod schema"
				submission={getSubmission('native', (formData) =>
					parse(formData, nativeConstraintSchema),
				)}
				form="native"
			>
				<Form id="native" method="post" action={action} {...typeFormProps}>
					<NativeConstraintFieldset />
				</Form>
			</Playground>
			<hr className={styles.divider} />
			<Playground
				title="Type Conversion"
				description="Parsing the form data based on the defined preprocess with zod"
				submission={getSubmission('type', (formData) =>
					parse(formData, typeConversionSchema),
				)}
				form="type"
			>
				<Form id="type" method="post" action={action} {...typeFormProps}>
					<TypeConversionFieldset />
				</Form>
			</Playground>
		</>
	);
}

const nativeConstraintSchema = z.object({
	name: z
		.string()
		.min(8)
		.max(20)
		.regex(/^[0-9a-zA-Z]{8,20}$/),
	remarks: z.string().optional(),
	score: z.preprocess(
		(value) => (typeof value !== 'undefined' ? Number(value) : undefined),
		z.number().min(1).max(100).step(10).optional(),
	),
	grade: z.enum(['A', 'B', 'C', 'D', 'E', 'F']).default('F'),
});

function NativeConstraintFieldset() {
	const [fieldsetProps, { name, remarks, grade, score }] = useFieldset(
		resolve(nativeConstraintSchema),
	);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Name" error={name.error}>
				<input
					className={styles.input}
					{...conform.input(name, { type: 'text' })}
				/>
			</Field>
			<Field label="Remarks" error={remarks.error}>
				<input
					className={styles.input}
					{...conform.input(remarks, { type: 'text' })}
				/>
			</Field>
			<Field label="Score" error={score.error}>
				<input
					className={styles.input}
					{...conform.input(score, { type: 'number' })}
				/>
			</Field>
			<Field label="Grade" error={grade.error}>
				<input
					className={styles.input}
					{...conform.input(grade, { type: 'text' })}
				/>
			</Field>
		</fieldset>
	);
}

const typeConversionSchema = z.object({
	number: z.preprocess(Number, z.number()),
	boolean: z.preprocess((value) => value === 'Yes', z.boolean()),
	datetime: z.preprocess((value) => new Date(value as any), z.date()),
});

function TypeConversionFieldset() {
	const [fieldsetProps, { number, datetime, boolean }] = useFieldset(
		resolve(typeConversionSchema),
	);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Number" error={number.error}>
				<input
					className={styles.input}
					{...conform.input(number, { type: 'text' })}
				/>
			</Field>
			<Field label="Datetime" error={datetime.error}>
				<input
					className={styles.input}
					{...conform.input(datetime, { type: 'text' })}
				/>
			</Field>
			<Field label="Boolean">
				<input
					className={styles.input}
					{...conform.input(boolean, { type: 'text' })}
				/>
			</Field>
		</fieldset>
	);
}
