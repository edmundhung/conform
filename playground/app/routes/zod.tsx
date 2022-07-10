import { useFieldset, conform, useForm } from '@conform-to/react';
import { parse, resolve } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import { z } from 'zod';
import { Field, Playground } from '~/components';
import { useFormConfig, useFormResult } from '~/config';
import { styles } from '~/helpers';

const schema = z.object({
	number: z.preprocess(Number, z.number()),
	boolean: z.preprocess((value) => value === 'Yes', z.boolean()),
	datetime: z.preprocess((value) => new Date(value as any), z.date()),
});

export default function ZodIntegration() {
	const [result, onSubmit, onReset] = useFormResult((payload) =>
		parse(payload, schema),
	);
	const [config] = useFormConfig();
	const typeFormProps = useForm({ ...config, onSubmit, onReset });

	return (
		<>
			<Playground title="Type Conversion" result={result['type']} form="type">
				<Form id="type" {...typeFormProps}>
					<TypeConversionFieldset />
				</Form>
			</Playground>
			<hr className={styles.divider} />
		</>
	);
}

function TypeConversionFieldset() {
	const [fieldsetProps, { number, datetime, boolean }] = useFieldset(
		resolve(schema),
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
