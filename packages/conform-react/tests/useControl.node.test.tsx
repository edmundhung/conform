import { describe, it, expect, vi } from 'vitest';
import { useControl } from '../future';
import { serverRenderHook } from './helpers';

describe('future export: useControl', () => {
	const defaultResult = {
		value: undefined,
		options: undefined,
		files: undefined,
		checked: undefined,
		defaultValue: undefined,
		payload: undefined,
		formRef: { current: null },
		register: expect.any(Function),
		change: expect.any(Function),
		blur: expect.any(Function),
		focus: expect.any(Function),
	};
	const txtFile = new File(['hello world'], 'hello.txt', {
		type: 'text/plain',
	});
	const sqlFile = new File(['CREATE TABLE users;'], 'schema.sql', {
		type: 'application/sql',
	});

	it('infers initial value based on the options', async () => {
		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: undefined,
				}),
			),
		).toEqual(defaultResult);

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: null,
				}),
			),
		).toEqual({
			...defaultResult,
			checked: false,
			defaultValue: null,
			payload: null,
			value: '',
			options: [],
			files: [],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: 'hello world',
				}),
			),
		).toEqual({
			...defaultResult,
			checked: undefined,
			defaultValue: 'hello world',
			value: 'hello world',
			payload: 'hello world',
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: ['foo', 'bar'],
				}),
			),
		).toEqual({
			...defaultResult,
			checked: undefined,
			defaultValue: ['foo', 'bar'],
			options: ['foo', 'bar'],
			payload: ['foo', 'bar'],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultChecked: true,
				}),
			),
		).toEqual({
			...defaultResult,
			defaultValue: 'on',
			value: 'on',
			checked: true,
			payload: 'on',
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultChecked: false,
					value: 'yes',
				}),
			),
		).toEqual({
			...defaultResult,
			checked: false,
			defaultValue: null,
			payload: null,
			value: '',
			options: [],
			files: [],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: txtFile,
				}),
			),
		).toEqual({
			...defaultResult,
			checked: undefined,
			defaultValue: txtFile,
			payload: txtFile,
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: [sqlFile, txtFile],
				}),
			),
		).toEqual({
			...defaultResult,
			checked: undefined,
			defaultValue: [sqlFile, txtFile],
			files: [sqlFile, txtFile],
			payload: [sqlFile, txtFile],
		});
	});

	it('treats null as a cleared payload for convenience accessors', () => {
		const control = serverRenderHook(() =>
			useControl({
				defaultValue: null,
			}),
		);

		expect(control.defaultValue).toBeNull();
		expect(control.payload).toBeNull();
		expect(control.checked).toBe(false);
		expect(control.value).toBe('');
		expect(control.options).toEqual([]);
		expect(control.files).toEqual([]);
	});

	it('treats empty arrays as both options and files views', () => {
		const control = serverRenderHook(() =>
			useControl({
				defaultValue: [],
			}),
		);

		expect(control.defaultValue).toEqual([]);
		expect(control.payload).toEqual([]);
		expect(control.value).toBeUndefined();
		expect(control.checked).toBeUndefined();
		expect(control.options).toEqual([]);
		expect(control.files).toEqual([]);
	});

	it('works if the File or FileList class is not available on global', async () => {
		vi.stubGlobal('File', undefined);
		vi.stubGlobal('FileList', undefined);

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: undefined,
				}),
			),
		).toEqual(defaultResult);

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: null,
				}),
			),
		).toEqual({
			...defaultResult,
			checked: false,
			defaultValue: null,
			payload: null,
			value: '',
			options: [],
			files: [],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: 'hello world',
				}),
			),
		).toEqual({
			...defaultResult,
			checked: undefined,
			defaultValue: 'hello world',
			value: 'hello world',
			payload: 'hello world',
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: ['foo', 'bar'],
				}),
			),
		).toEqual({
			...defaultResult,
			checked: undefined,
			defaultValue: ['foo', 'bar'],
			options: ['foo', 'bar'],
			payload: ['foo', 'bar'],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultChecked: true,
				}),
			),
		).toEqual({
			...defaultResult,
			defaultValue: 'on',
			value: 'on',
			checked: true,
			payload: 'on',
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultChecked: false,
					value: 'yes',
				}),
			),
		).toEqual({
			...defaultResult,
			checked: false,
			defaultValue: null,
			payload: null,
			value: '',
			options: [],
			files: [],
		});
	});

	it('throws contextual error when parse fails', () => {
		expect(() => {
			const control = serverRenderHook(() =>
				useControl({
					defaultValue: {
						members: [{ id: '1' }],
					},
					parse() {
						throw new Error('Expected members array');
					},
				}),
			);

			return control.payload;
		}).toThrowError(/Failed to parse the payload\. Received/);
	});
});
