import type { ActionFunction } from '@remix-run/node';
import type { FieldConfig } from '@conform-to/dom';
import { Form, useActionData } from '@remix-run/react';
import { parse, createFieldset } from '@conform-to/zod';
import { useForm, useFieldset, useFieldList, f } from '@conform-to/react';
import { styles } from '~/helpers';
import * as z from 'zod';

const product = z.object({
	item: z.string({ required_error: 'Product name is required' }),
	quantity: z
		.number({ required_error: 'Required', invalid_type_error: 'Invalid' })
		.min(1, 'Min. 1'),
});

const schema = z.object({
	products: z.array(product).min(1, 'At least 1 product is required'),
	address: z.string({ required_error: 'Address is required' }),
	delivery: z.enum(['standard', 'express']),
	remarks: z.string().optional(),
});

const fieldset = createFieldset(schema);

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const formResult = parse(formData, schema);

	return formResult;
};

export default function OrderForm() {
	const formResult = useActionData() ?? {};
	const formProps = useForm({ initialReport: 'onBlur' });
	const [setup, errorMessage] = useFieldset(fieldset, formResult);
	const [products, control] = useFieldList(setup.field.products);

	return (
		<>
			<main className="p-8">
				{formResult.state === 'accepted' ? (
					<>
						<div className="mb-4 text-emerald-500">Order success</div>
						{formResult.value?.products?.map((product, i) => (
							<div key={i} className="text-gray-600">{`Product #${i + 1} - ${
								product.item
							} x${product.quantity}`}</div>
						)) ?? null}
						<div className="text-gray-600">
							Address:{' '}
							{formResult.value?.address ? formResult.value.address : 'n/a'}
						</div>
						<div className="text-gray-600">
							Remarks:{' '}
							{formResult.value?.remarks ? formResult.value.remarks : 'n/a'}
						</div>
					</>
				) : (
					<div className="mb-4">Wanna order something?</div>
				)}
			</main>
			<Form
				method="post"
				className={`flex flex-col-reverse ${styles.form}`}
				{...formProps}
			>
				<button type="submit" className={styles.buttonPrimary}>
					Order now
				</button>
				<fieldset className="space-y-4" {...setup.fieldset}>
					<div className="space-y-2">
						{products.map((product, index) => (
							<div className="flex items-end gap-4" key={product.key}>
								<div className="flex-1">
									<ProductFieldset
										label={`Product #${index + 1}`}
										{...product.config}
									/>
								</div>
								<button
									className={styles.buttonWarning}
									disabled={products.length === 1}
									{...control.remove(index)}
								>
									⨯
								</button>
							</div>
						))}
					</div>
					<button
						className={styles.buttonSecondary}
						disabled={products.length === 3}
						{...control.prepend()}
					>
						Add Product
					</button>
					<label className="block">
						<div className={styles.label}>Address</div>
						<input
							className={
								errorMessage.address ? styles.inputWithError : styles.input
							}
							{...f.input(setup.field.address)}
						/>
						<p className={styles.errorMessage}>{errorMessage.address}</p>
					</label>
					<div>
						<div className={styles.label}>Delivery Method</div>
						<div className="space-y-2 py-2">
							{schema.shape.delivery.options.map((option) => (
								<label className={styles.optionLabel} key={option}>
									<input
										className={styles.optionInput}
										{...f.input(setup.field.delivery, {
											type: 'radio',
											value: option,
										})}
									/>
									<span
										className={
											errorMessage.delivery
												? styles.optionWithError
												: styles.option
										}
									>
										{option}
									</span>
								</label>
							))}
						</div>
					</div>
					<label className="block">
						<div className={styles.label}>Remarks</div>
						<textarea
							className={
								errorMessage.remarks ? styles.inputWithError : styles.input
							}
							{...f.textarea(setup.field.remarks)}
						/>
						<p className={styles.errorMessage}>{errorMessage.remarks}</p>
					</label>
				</fieldset>
			</Form>
		</>
	);
}

const productFieldset = createFieldset(product);

interface ProductFieldsetProps extends FieldConfig<z.infer<typeof product>> {
	label: string;
}

function ProductFieldset({ label, ...options }: ProductFieldsetProps) {
	const [setup, error] = useFieldset(productFieldset, options);

	return (
		<fieldset className="flex gap-4" {...setup.fieldset}>
			<label className="block flex-1">
				<div className={styles.label}>{label}</div>
				<input
					className={error.item ? styles.inputWithError : styles.input}
					{...f.input(setup.field.item)}
				/>
			</label>
			<label className="block w-16">
				<div className={styles.label}>Quantity</div>
				<input
					className={error.quantity ? styles.inputWithError : styles.input}
					{...f.input(setup.field.quantity, { type: 'number' })}
				/>
			</label>
		</fieldset>
	);
}
