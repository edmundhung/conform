import { coerceFormValue } from '@conform-to/zod/v4/future';
import { useState } from 'react';
import { z } from 'zod';
import {
	ExampleCheckbox,
	ExampleRadioGroup,
	ExampleSlider,
	ExampleSwitch,
	ExampleToggleGroup,
	ExampleSelect,
} from './form';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		isTermsAgreed: z.boolean(),
		carType: z.enum(['sedan', 'hatchback', 'suv']),
		userCountry: z.enum(['usa', 'canada', 'mexico']),
		estimatedKilometersPerYear: z.number().min(1).max(100000),
		insurance: z.boolean(),
		desiredContractType: z.enum(['full', 'part']),
	}),
);

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const { form, fields, intent } = useForm(schema, {
		defaultValue: {
			isTermsAgreed: searchParams.get('isTermsAgreed'),
			carType: searchParams.get('carType'),
			userCountry: searchParams.get('userCountry'),
			estimatedKilometersPerYear: searchParams.get(
				'estimatedKilometersPerYear',
			),
			insurance: searchParams.get('insurance'),
			desiredContractType: searchParams.get('desiredContractType'),
		},
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const searchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(searchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<main className="flex flex-col gap-4 p-12 font-sans">
			<form
				{...form.props}
				onChange={() => setSubmittedValue(null)}
				className="flex flex-col gap-12 p-12 rounded-lg mx-auto"
			>
				<h1 className="font-bold text-4xl">Radix UI Example</h1>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Checkbox</h2>
					<div className="flex items-center gap-2">
						<ExampleCheckbox
							{...fields.isTermsAgreed.checkboxProps}
							// Equivalent to:
							// id={fields.isTermsAgreed.id}
							// name={fields.isTermsAgreed.name}
							// value="on"
							// defaultChecked={fields.isTermsAgreed.defaultChecked}
							// aria-invalid={fields.isTermsAgreed.ariaInvalid}
							// aria-describedby={fields.isTermsAgreed.ariaDescribedBy}
						/>
						<label htmlFor={fields.isTermsAgreed.id}>
							Accept terms and conditions.
						</label>
					</div>
					<span
						id={fields.isTermsAgreed.errorId}
						className="text-red-500 min-h-6"
					>
						{fields.isTermsAgreed.errors}
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Radio Group</h2>
					<div className="flex flex-col gap-2">
						<span id={`${fields.carType.id}-label`}>Car type:</span>
						<ExampleRadioGroup
							items={[
								{ value: 'sedan', label: 'Sedan' },
								{ value: 'hatchback', label: 'Hatchback' },
								{ value: 'suv', label: 'SUV' },
								{ value: 'other', label: 'Other (not valid choice)' },
							]}
							{...fields.carType.radioGroupProps}
							// Equivalent to:
							// id={fields.carType.id}
							// name={fields.carType.name}
							// defaultValue={fields.carType.defaultValue}
							// aria-invalid={fields.carType.ariaInvalid}
							// aria-describedby={fields.carType.ariaDescribedBy}
							// aria-labelledby={`${fields.carType.id}-label`}
						/>
						<span id={fields.carType.errorId} className="text-red-500 min-h-6">
							{fields.carType.errors}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-2 items-start">
					<h2 className="font-medium">Select</h2>
					<label htmlFor={fields.userCountry.id}>Country</label>
					<ExampleSelect
						placeholder="Select a country 🗺"
						items={[
							{ name: 'USA', value: 'usa' },
							{ name: 'Canada', value: 'canada' },
							{ name: 'Mexico', value: 'mexico' },
						]}
						{...fields.userCountry.selectProps}
						// Equivalent to:
						// id={fields.userCountry.id}
						// name={fields.userCountry.name}
						// defaultValue={fields.userCountry.defaultValue}
						// aria-invalid={fields.userCountry.ariaInvalid}
						// aria-describedby={fields.userCountry.ariaDescribedBy}
					/>
					<span
						id={fields.userCountry.errorId}
						className="text-red-500 min-h-6"
					>
						{fields.userCountry.errors}
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Slider</h2>
					<div className="flex flex-col gap-2">
						<span id={`${fields.estimatedKilometersPerYear.id}-label`}>
							Estimated kilometers per year:
						</span>
						<ExampleSlider
							max={10_000}
							{...fields.estimatedKilometersPerYear.sliderProps}
							// Equivalent to:
							// id={fields.estimatedKilometersPerYear.id}
							// name={fields.estimatedKilometersPerYear.name}
							// defaultValue={fields.estimatedKilometersPerYear.defaultValue}
							// aria-invalid={fields.estimatedKilometersPerYear.ariaInvalid}
							// aria-describedby={fields.estimatedKilometersPerYear.ariaDescribedBy}
							// aria-labelledby={`${fields.estimatedKilometersPerYear.id}-label`}
						/>
						<span
							id={fields.estimatedKilometersPerYear.errorId}
							className="text-red-500 min-h-6"
						>
							{fields.estimatedKilometersPerYear.errors}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Switch</h2>
					<div className="flex items-center gap-2">
						<ExampleSwitch
							{...fields.insurance.switchProps}
							// Equivalent to:
							// id={fields.insurance.id}
							// name={fields.insurance.name}
							// value="on"
							// defaultChecked={fields.insurance.defaultChecked}
							// aria-invalid={fields.insurance.ariaInvalid}
							// aria-describedby={fields.insurance.ariaDescribedBy}
						/>
						<label htmlFor={fields.insurance.id}>Insurance</label>
					</div>
					<span id={fields.insurance.errorId} className="text-red-500 min-h-6">
						{fields.insurance.errors}
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium">Toggle group</h2>
					<div className="flex flex-col gap-2">
						<span id={`${fields.desiredContractType.id}-label`}>
							Desired contract type:
						</span>
						<ExampleToggleGroup
							items={[
								{ value: 'full', label: 'Full' },
								{ value: 'part', label: 'Part time' },
								{ value: 'not valid', label: 'not Valid' },
							]}
							{...fields.desiredContractType.toggleGroupProps}
							// Equivalent to:
							// id={fields.desiredContractType.id}
							// name={fields.desiredContractType.name}
							// defaultValue={fields.desiredContractType.defaultValue}
							// aria-invalid={fields.desiredContractType.ariaInvalid}
							// aria-describedby={fields.desiredContractType.ariaDescribedBy}
							// aria-labelledby={`${fields.desiredContractType.id}-label`}
						/>
						<span
							id={fields.desiredContractType.errorId}
							className="text-red-500 min-h-6"
						>
							{fields.desiredContractType.errors}
						</span>
					</div>
				</div>

				{submittedValue ? (
					<div className="flex flex-col gap-2">
						<h4>Value submitted</h4>
						<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
					</div>
				) : null}

				<div className="flex items-center gap-3">
					<button
						type="submit"
						className="bg-neutral-800 px-3 py-2 rounded-lg text-white hover:opacity-90 grow"
					>
						Submit
					</button>
					<button
						type="button"
						className="hover:opacity-90 px-3 py-2 border-neutral-300 border rounded-lg grow"
						onClick={() => intent.reset()}
					>
						Reset
					</button>
				</div>
			</form>
		</main>
	);
}
