import { getMetadata, isInput, useForm } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { useRef } from 'react';
import { z } from 'zod';
import {
	ExampleCheckbox,
	ExampleRadioGroup,
	ExampleSlider,
	ExampleSwitch,
	ExampleToggleGroup,
	ExampleSelect,
} from './form';

const schema = coerceZodFormData(
	z.object({
		isTermsAgreed: z.boolean(),
		carType: z.enum(['sedan', 'hatchback', 'suv']),
		userCountry: z.enum(['usa', 'canada', 'mexico']),
		estimatedKilometersPerYear: z.number().min(1).max(100000),
		hasAdditionalDriver: z
			.boolean()
			.optional()
			.refine((flag) => !flag, {
				message: 'You cannot have an additional driver',
			}),
		desiredContractType: z.enum(['full', 'part']),
	}),
);

export default function App() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, handleSubmit, intent } = useForm(formRef, {
		onValidate(value) {
			const result = schema.safeParse(value);
			return resolveZodResult(result);
		},
		onSubmit(e, { value }) {
			e.preventDefault();
			alert(JSON.stringify(value, null, 2));
		},
	});
	const { fields } = getMetadata(state, {
		defaultValue: {
			carType: 'hatchback',
			desiredContractType: 'part',
		},
	});

	return (
		<main className="flex flex-col gap-4 p-12 font-sans">
			<form
				ref={formRef}
				onSubmit={handleSubmit}
				onBlur={(event) => {
					if (
						isInput(event.target) &&
						!state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				onInput={(event) => {
					if (
						isInput(event.target) &&
						state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				className="bg-neutral-100 flex flex-col gap-12 p-12 rounded-lg mx-auto"
			>
				<h1 className="font-bold text-4xl text-amber-800">
					Radix UI + Conform
				</h1>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Checkbox</h2>
					<div className="flex items-center gap-2">
						<ExampleCheckbox name={fields.isTermsAgreed.name} />
						<label>Accept terms and conditions.</label>
					</div>
					<span className="text-red-800">{fields.isTermsAgreed.error}</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Radio Group</h2>
					<div className="flex flex-col gap-2">
						Car type:
						<ExampleRadioGroup
							name={fields.carType.name}
							items={[
								{ value: 'sedan', label: 'Sedan' },
								{ value: 'hatchback', label: 'Hatchback' },
								{ value: 'suv', label: 'SUV' },
								{ value: 'other', label: 'Other (not valid choice)' },
							]}
						/>
						<span className="text-red-800">{fields.carType.error}</span>
					</div>
				</div>
				<div className="flex flex-col gap-2 items-start">
					<h2 className="text-medium text-amber-600">Select</h2>
					<label>Country</label>
					<ExampleSelect
						name={fields.userCountry.name}
						placeholder="Select a country 🗺"
						items={[
							{ name: 'USA', value: 'usa' },
							{ name: 'Canada', value: 'canada' },
							{ name: 'Mexico', value: 'mexico' },
						]}
					/>
					<span className="text-red-800">{fields.userCountry.error}</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Slider</h2>
					<div className="flex flex-col gap-2">
						Estimated kilometers per year:
						<ExampleSlider
							name={fields.estimatedKilometersPerYear.name}
							max={10_000}
						/>
						<span className="text-red-800">
							{fields.estimatedKilometersPerYear.error}
						</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Switch</h2>
					<div className="flex items-center gap-2">
						<ExampleSwitch name={fields.hasAdditionalDriver.name} />
						<label>Has additional driver</label>
					</div>
					<span className="text-red-800">
						{fields.hasAdditionalDriver.error}
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<h2 className="font-medium text-amber-600">Toggle group</h2>
					<div className="flex flex-col gap-2">
						Desired contract type:
						<ExampleToggleGroup
							name={fields.desiredContractType.name}
							items={[
								{ value: 'full', label: 'Full' },
								{ value: 'part', label: 'Part time' },
								{ value: 'not valid', label: 'not Valid' },
							]}
						/>
						<span className="text-red-800">
							{fields.desiredContractType.error}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="submit"
						className="bg-amber-800 px-3 py-2 rounded-lg text-white hover:opacity-90 grow"
					>
						Submit
					</button>
					<button
						type="button"
						className="text-amber-800 hover:opacity-90 px-3 py-2 border-neutral-300 border rounded-lg grow"
						onClick={() => intent.reset()}
					>
						Reset
					</button>
				</div>
			</form>
		</main>
	);
}
