# useControl

> `useControl` フックはConformのfuture exportの一部です。これらのAPIは試験的なもので、マイナーバージョンで変更される可能性があります。[詳しく見る（英語）](https://github.com/edmundhung/conform/discussions/954)

このフックでは入力のための要素と同期し、そこで発生するネイティブなフォームイベントを発火させることができるようにします。
ネイティブな入力の振る舞いをエミュレートする時、よくあるhiddenに設定された入力要素とカスタム入力要素を同期させる時に便利です。

このフックが必要な時により詳細な情報を求める場合は、[UI ライブラリとの統合ガイド](../../../integration/ui-libraries.md) を見てください。


```ts
import { useControl } from '@conform-to/react/future';

const control = useControl(options);
```

## Options

### `defaultValue?: string | string[] | File | File[]`

標準入力の初期値です。入力要素が最初に登録された時にセットされるために使われます。

```ts
// 例：テキスト入力
const control = useControl({
  defaultValue: 'my default value',
});
// 例：マルチセレクト
const control = useControl({
  defaultValue: ['option-1', 'option-3'],
});
```

### `defaultChecked?: boolean`

標準入力が始めにチェックされているべきかどうかを設定します。
入力要素が最初に登録された時に適用されます。

```ts
const control = useControl({
  defaultChecked: true,
});
```

### `value?: string`

チェックボックスかラジオの値がチェックされた時の値です。
標準入力のvalue属性を設定します。

```ts
const control = useControl({
  defaultChecked: true,
  value: 'option-value',
});
```

### `onFocus?: () => void`

標準入力にフォーカスが当たった時に発火されるコールバック関数です。この関数を通してカスタム入力要素へフォーカスを移せます。


```ts
const control = useControl({
  onFocus() {
    controlInputRef.current?.focus();
  },
});
```

## Returns

コントロールオブジェクトを返します。
入力要素の状態とネイティブなフォームイベントを操作するためのヘルパーにアクセスできます。

### `value: string | undefined`

標準入力の現在の値です。登録された値がマルチセレクト、ファイル、チェックボックスグループであれば値は未定義になります。

### `options: string[] | undefined`

標準入力で選択されたオプションです。登録された標準入力がマルチセレクトかチェックボックスグループの時に定義されます。

### `checked: boolean | undefined`

標準入力のチェック状態です。登録された標準入力が単一のチェックボックスかラジオの時に定義されます。

### `files: File[] | undefined`

標準入力の選択されたファイルです。
登録された標準入力が単一のチェックボックスかラジオの時に定義されます。

### `register: (element: HTMLInputElement | HTMLSelectElement | HTMLTextareaElement | Array<HTMLInputElement>) => void`

Registers the base input element(s). Accepts a single input or an array for groups.

### `change(value: string | string[] | boolean | File | File[] | FileList | null): void`

Programmatically updates the input value and emits both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.

### `blur(): void`

Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events. Does not actually move focus.

### `focus(): void`

Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events. This does not move the actual keyboard focus to the input. Use `element.focus()` instead if you want to move focus to the input.

## Example

### Checkbox / Switch

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Checkbox } from './custom-checkbox-component';

function Example() {
  const [form, fields] = useForm({
    defaultValues: {
      newsletter: true,
    },
  });
  const control = useControl({
    defaultChecked: fields.newsletter.defaultChecked,
  });

  return (
    <>
      <input
        type="checkbox"
        name={fields.newsletter.name}
        ref={control.register}
        hidden
      />
      <Checkbox
        checked={control.checked}
        onChange={(checked) => control.change(checked)}
        onBlur={() => control.blur()}
      >
        Subscribe to newsletter
      </Checkbox>
    </>
  );
}
```

### Multi-select

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Select, Option } from './custom-select-component';

function Example() {
  const [form, fields] = useForm({
    defaultValues: {
      categories: ['tutorial', 'blog'],
    },
  });
  const control = useControl({
    defualtValue: fields.categories.defaultOptions,
  });

  return (
    <>
      <select
        name={fields.categories.name}
        ref={control.register}
        multiple
        hidden
      />
      <Select
        value={control.options}
        onChange={(options) => control.change(options)}
        onBlur={() => control.blur()}
      >
        <Option value="blog">Blog</Option>
        <Option value="tutorial">Tutorial</Option>
        <Option value="guide">Guide</Option>
      </Select>
    </>
  );
}
```

### File input

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { DropZone } from './custom-file-input-component';
function Example() {
  const [form, fields] = useForm();
  const control = useControl();

  return (
    <>
      <input
        type="file"
        name={fields.attachements.name}
        ref={control.register}
        hidden
      />
      <DropZone
        files={control.files}
        onChange={(files) => control.change(files)}
        onBlur={() => control.blur()}
      />
    </>
  );
}
```

## Tips

### Progressive enhancement

If you care about supporting form submissions before JavaScript loads, set `defaultValue`, `defaultChecked`, or `value` directly on the base input. This ensures correct values are included in the form submission. Otherwise, `useControl` will handle it once the app is hydrated.

```jsx
// Input
<input
  type="email"
  name={fields.email.name}
  defaultValue={fields.email.defaultValue}
  ref={control.register}
  hidden
/>

// Select
<select
  name={fields.categories.name}
  defaultValue={fields.categories.defaultOptions}
  ref={control.register}
  hidden
>
  <option value=""></option>
  {fields.categories.defaultOptions.map(option => (
    <option key={option} value={option}>
      {option}
    </option>
  ))}
</select>

// Textarea
<textarea
  name={fields.description.name}
  defaultValue={fields.description.defaultValue}
  ref={control.register}
  hidden
/>
```

### Checkbox / Radio groups

You can register multiple checkbox or radio inputs as a group by passing an array of elements to `register()`. This is useful when the setup renders a set of native inputs that you want to re-use without re-implementing the group logic:

```jsx
<CustomCheckboxGroup
  ref={(el) => control.register(el?.querySelectorAll('input'))}>
  value={control.options}
  onChange={(options) => control.change(options)}
  onBlur={() => control.blur()}
/>
```

If you don't need to re-use the existing native inputs, you can always represent the group with a single hidden multi-select or text input. For complete examples, see the checkbox and radio group implementations in the [React Aria example](../../../../examples/react-aria/).
