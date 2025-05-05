import { type FormId, type FieldName } from '@conform-to/dom';
import { useEffect } from 'react';
import {
	type FormMetadata,
	type FieldMetadata,
	type Pretty,
	type FormOptions,
} from './context';
/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
export declare const useSafeLayoutEffect: typeof useEffect;
export declare function useFormId<
	Schema extends Record<string, unknown>,
	FormError,
>(preferredId?: string): FormId<Schema, FormError>;
export declare function useNoValidate(defaultNoValidate?: boolean): boolean;
export declare function useForm<
	Schema extends Record<string, any>,
	FormValue = Schema,
	FormError = string[],
>(
	options: Pretty<
		Omit<FormOptions<Schema, FormError, FormValue>, 'formId'> & {
			/**
			 * The form id. If not provided, a random id will be generated.
			 */
			id?: string;
			/**
			 * Enable constraint validation before the dom is hydated.
			 *
			 * Default to `true`.
			 */
			defaultNoValidate?: boolean;
		}
	>,
): [
	FormMetadata<Schema, FormError>,
	ReturnType<FormMetadata<Schema, FormError>['getFieldset']>,
];
export declare function useFormMetadata<
	Schema extends Record<string, any>,
	FormError = string[],
>(
	formId?: FormId<Schema, FormError>,
	options?: {
		defaultNoValidate?: boolean;
	},
): FormMetadata<Schema, FormError>;
export declare function useField<
	FieldSchema,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
	FormError = string[],
>(
	name: FieldName<FieldSchema, FormSchema, FormError>,
	options?: {
		formId?: FormId<FormSchema, FormError>;
	},
): [
	FieldMetadata<FieldSchema, FormSchema, FormError>,
	FormMetadata<FormSchema, FormError>,
];
export type Control = {
	value: string | undefined;
	checked: boolean | undefined;
	options: string[] | undefined;
	files: File[] | undefined;
	register: (
		element:
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLCollectionOf<HTMLInputElement>
			| NodeListOf<HTMLInputElement>
			| null
			| undefined,
	) => void;
	change(value: string | string[] | boolean | File | File[] | FileList): void;
	focus(): void;
	blur(): void;
};
export declare const formObserver: {
	onFieldUpdate(
		callback: (event: {
			type: 'input' | 'reset' | 'mutation';
			target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
		}) => void,
	): () => void;
	onFormUpdate(
		callback: (event: {
			type: 'submit' | 'input' | 'reset' | 'mutation';
			target: HTMLFormElement;
			submitter?: HTMLInputElement | HTMLButtonElement | null;
		}) => void,
	): () => void;
	dispose(): void;
};
export declare function useControl(options?: {
	defaultValue?: string | string[] | File | File[] | null | undefined;
	defaultChecked?: boolean | undefined;
	value?: string;
}): Control;
