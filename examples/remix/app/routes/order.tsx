import type { FieldConfig } from '@conform-to/dom';
import { useForm, useFieldset, useFieldList, conform } from '@conform-to/react';
import { parse, resolve } from '@conform-to/zod';
import type { ActionFunction } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import * as z from 'zod';
import { styles } from '~/helpers';

const product = z.object({
	item: z.string({ required_error: 'Product name is required' }),
	quantity: z
		.number({ required_error: 'Required', invalid_type_error: 'Invalid' })
		.min(1, 'Min. 1'),
});

const shipping = z.object({
	address: z.string({ required_error: 'Address is required' }),
	delivery: z.enum(['standard', 'express']),
});

const order = z.object({
	products: z.array(product).min(1, 'At least 1 product is required'),
	shipping: shipping,
	remarks: z.string().optional(),
});

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const formResult = parse(formData, order);

	return formResult;
};

export default function OrderForm() {
	const formResult = useActionData();
	const formProps = useForm({ initialReport: 'onBlur' });
	const [fieldsetProps, { products, shipping, remarks }] = useFieldset(
		resolve(order),
		{
			initialValue: formResult?.value,
			error: formResult?.error,
		},
	);
	const [productList, control] = useFieldList(products);

	return (
		<Form method="post" {...formProps}>
			<main className="p-8">
				<div className="mb-4">Order Form</div>
				{formResult?.state === 'accepted' ? (
					<>
						<div className="mb-4 text-emerald-500">Success</div>
						<pre>{JSON.stringify(formResult?.value, null, 2)}</pre>
					</>
				) : null}
			</main>
			<fieldset className={styles.form} {...fieldsetProps}>
				<div className="space-y-4">
					<div className="space-y-2">
						{productList.map((product, index) => (
							<div className="flex items-end gap-4" key={product.key}>
								<div className="flex-1">
									<ProductFieldset
										label={`Product #${index + 1}`}
										{...product.config}
									/>
								</div>
								<button
									className={styles.buttonWarning}
									disabled={productList.length === 1}
									{...control.remove(index)}
								>
									⨯
								</button>
							</div>
						))}
					</div>
					<button className={styles.buttonSecondary} {...control.append()}>
						Add Product
					</button>
					<ShippingFieldset {...shipping} />
					<label className="block">
						<div className={styles.label}>Remarks</div>
						<textarea
							className={remarks.error ? styles.invalidInput : styles.input}
							{...conform.textarea(remarks)}
						/>
						<p className={styles.errorMessage}>{remarks.error}</p>
					</label>
				</div>

				<button type="submit" className={styles.buttonPrimary}>
					Order now
				</button>
			</fieldset>
		</Form>
	);
}

function ShippingFieldset(config: FieldConfig<z.infer<typeof shipping>>) {
	const [fieldsetProps, { address, delivery }] = useFieldset(
		resolve(shipping),
		config,
	);

	return (
		<fieldset {...fieldsetProps}>
			<label className="block">
				<div className={styles.label}>Address</div>
				<input
					className={address.error ? styles.invalidInput : styles.input}
					{...conform.input(address)}
				/>
				<p className={styles.errorMessage}>{address.error}</p>
			</label>
			<div>
				<div className={styles.label}>Delivery Method</div>
				<div className="space-y-2 py-2">
					{shipping.shape.delivery.options.map((option) => (
						<label className={styles.optionLabel} key={option}>
							<input
								className={styles.optionInput}
								{...conform.input(delivery, {
									type: 'radio',
									value: option,
								})}
							/>
							<span
								className={
									delivery.error ? styles.invalidOption : styles.option
								}
							>
								{option}
							</span>
						</label>
					))}
				</div>
			</div>
		</fieldset>
	);
}

function ProductFieldset({
	label,
	...config
}: FieldConfig<z.infer<typeof product>> & { label: string }) {
	const [fieldsetProps, { item, quantity }] = useFieldset(
		resolve(product),
		config,
	);

	return (
		<fieldset className="flex gap-4" {...fieldsetProps}>
			<label className="block flex-1">
				<div className={styles.label}>{label}</div>
				<input
					className={item.error ? styles.invalidInput : styles.input}
					{...conform.input(item)}
				/>
			</label>
			<label className="block w-16">
				<div className={styles.label}>Quantity</div>
				<input
					className={quantity.error ? styles.invalidInput : styles.input}
					{...conform.input(quantity, { type: 'number' })}
				/>
			</label>
		</fieldset>
	);
}
