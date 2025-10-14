import { describe, it, expect, vi } from 'vitest';
import { useControl } from '../future';
import { serverRenderHook } from './helpers';

describe('future export: useControl', () => {
	const defaultResult = {
		value: undefined,
		options: undefined,
		files: undefined,
		checked: undefined,
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
		).toEqual(defaultResult);

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: 'hello world',
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'hello world',
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: ['foo', 'bar'],
				}),
			),
		).toEqual({
			...defaultResult,
			options: ['foo', 'bar'],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultChecked: true,
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'on',
			checked: true,
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
			value: 'yes',
			checked: false,
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: txtFile,
				}),
			),
		).toEqual({
			...defaultResult,
			files: [txtFile],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: [sqlFile, txtFile],
				}),
			),
		).toEqual({
			...defaultResult,
			files: [sqlFile, txtFile],
		});
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
		).toEqual(defaultResult);

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: 'hello world',
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'hello world',
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultValue: ['foo', 'bar'],
				}),
			),
		).toEqual({
			...defaultResult,
			options: ['foo', 'bar'],
		});

		expect(
			serverRenderHook(() =>
				useControl({
					defaultChecked: true,
				}),
			),
		).toEqual({
			...defaultResult,
			value: 'on',
			checked: true,
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
			value: 'yes',
			checked: false,
		});
	});
});
