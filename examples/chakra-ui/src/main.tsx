import {
	type BaseMetadata,
	FormOptionsProvider,
} from '@conform-to/react/future';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ChakraProvider } from '@chakra-ui/react';
import type {
	Input,
	Select,
	Textarea,
	Checkbox,
	Switch,
} from '@chakra-ui/react';
import type {
	ExampleNumberInput,
	ExamplePinInput,
	ExampleSlider,
	ExampleRadioGroup,
	ExampleEditable,
} from './form';

// Define custom metadata properties that matches the type of our custom form components
function defineCustomMetadata<FieldShape, ErrorShape>(
	metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
	return {
		get inputProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
				required: metadata.required,
			} satisfies Partial<React.ComponentProps<typeof Input>>;
		},
		get selectProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
				required: metadata.required,
			} satisfies Partial<React.ComponentProps<typeof Select>>;
		},
		get textareaProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
				required: metadata.required,
			} satisfies Partial<React.ComponentProps<typeof Textarea>>;
		},
		get checkboxProps() {
			return {
				name: metadata.name,
				value: 'on',
				defaultChecked: metadata.defaultChecked,
				required: metadata.required,
			} satisfies Partial<React.ComponentProps<typeof Checkbox>>;
		},
		get switchProps() {
			return {
				name: metadata.name,
				value: 'on',
				defaultChecked: metadata.defaultChecked,
				required: metadata.required,
			} satisfies Partial<React.ComponentProps<typeof Switch>>;
		},
		get numberInputProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExampleNumberInput>>;
		},
		get pinInputProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExamplePinInput>>;
		},
		get sliderProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExampleSlider>>;
		},
		get radioGroupProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExampleRadioGroup>>;
		},
		get editableProps() {
			return {
				name: metadata.name,
				defaultValue: metadata.defaultValue,
			} satisfies Partial<React.ComponentProps<typeof ExampleEditable>>;
		},
	};
}

type MetadataDefinition<FieldShape, ErrorShape> = ReturnType<
	typeof defineCustomMetadata<FieldShape, ErrorShape>
>;

// Extend the CustomMetadata interface with our UI component props
// This makes the custom metadata available on all field metadata objects
declare module '@conform-to/react/future' {
	interface CustomMetadata<FieldShape, ErrorShape>
		extends MetadataDefinition<FieldShape, ErrorShape> {}
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ChakraProvider>
			<FormOptionsProvider
				shouldValidate="onBlur"
				shouldRevalidate="onInput"
				defineCustomMetadata={defineCustomMetadata}
			>
				<App />
			</FormOptionsProvider>
		</ChakraProvider>
	</StrictMode>,
);
