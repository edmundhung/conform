import { conform, parse, useFieldset, useForm } from '@conform-to/react';
import {
	getError,
	getFieldsetConstraint,
	ifNonEmptyString,
} from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	iban: z
		.string()
		.regex(
			/^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/,
			'Please provide a valid IBAN',
		),
	amount: z.object({
		currency: z.enum(['USD', 'EUR', 'GBP']),
		value: z.preprocess(ifNonEmptyString(Number), z.number().min(1)),
	}),
	timestamp: z.preprocess(
		ifNonEmptyString((value) => new Date(value)),
		z.date(),
	),
	verified: z.preprocess(
		ifNonEmptyString((value) => value === 'Yes'),
		z.boolean().optional(),
	),
});

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const state = parse(formData);
	const result = schema.safeParse(state.value);

	if (!result.success) {
		return {
			...state,
			error: state.error.concat(getError(result.error)),
		};
	}

	return state;
};

export default function PaymentForm() {
	const { validate, ...config } = useLoaderData();
	const state = useActionData();
	const form = useForm<z.infer<typeof schema>>({
		...config,
		state,
	});
	const { iban, amount, timestamp, verified } = useFieldset(form.ref, {
		...form.config,
		constraint: getFieldsetConstraint(schema),
	});
	const { currency, value } = useFieldset(form.ref, {
		...amount.config,
		constraint: getFieldsetConstraint(schema.shape.amount),
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Payment Form" formState={state}>
				<fieldset>
					<Field label="IBAN" error={iban.error}>
						<input {...conform.input(iban.config, { type: 'text' })} />
					</Field>
					<Field label="Currency" error={currency.error}>
						<select {...conform.select(currency.config)}>
							<option value="">Please specify</option>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="GBP">GBP</option>
						</select>
					</Field>
					<Field label="Value" error={value.error}>
						<input {...conform.input(value.config, { type: 'number' })} />
					</Field>
					<Field label="Timestamp" error={timestamp.error}>
						<input {...conform.input(timestamp.config, { type: 'text' })} />
					</Field>
					<Field label="Verified" error={verified.error} inline>
						<input
							{...conform.input(verified.config, {
								type: 'checkbox',
								value: 'Yes',
							})}
						/>
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
