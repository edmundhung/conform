import { useFieldset, conform, useForm } from '@conform-to/react';
import { parse, resolve } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import { z } from 'zod';
import { Field, Playground } from '~/components';
import { styles } from '~/helpers';
import { loader, action, useActionData } from '~/playground';

export { loader, action };

export default function ZodIntegration() {
	const { config, action, getResult } = useActionData();
	const typeFormProps = useForm(config);

	return (
		<>
			<Playground
				title="Type Conversion"
				description="Parsing the form data based on the defined preprocess with zod"
				result={getResult('type', (formData) =>
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
