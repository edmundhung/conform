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

標準入力を登録します. 1つの入力もしくは入力グループに対する配列を受け取ります.

### `change(value: string | string[] | boolean | File | File[] | FileList | null): void`

値を変更した上で、[change](https://developer.mozilla.org/ja/docs/Web/API/HTMLElement/change_event) と [input](https://developer.mozilla.org/ja/docs/Web/API/Element/input_event) イベントの両方をディスパッチします。

### `blur(): void`

[blur](https://developer.mozilla.org/ja/docs/Web/API/Element/blur_event) と [focusout](https://developer.mozilla.org/ja/docs/Web/API/Element/focusout_event) イベントの両方をディスパッチします。focusは移動しません。

### `focus(): void`

[focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) と [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) のイベントをディスパッチします。これによって実際のキーボードフォーカスが入力に移動することはありません。代わりに、入力にフォーカスを移動させたいのであれば `element.focus()`を利用してください。

## 例

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

### マルチセレクト

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

### ファイル入力

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

### プログレッシブエンハンスメント（Progressive enhancement）

JavaScriptの読み込みが完了する前のフォーム送信に配慮したい場合、`defaultValue`、`defaultChecked`、または標準入力の`value`を直接設定してください。
これにより正しい値をフォームの送信時に含めることができます。
もしくは, `useControl`がハイドレーション完了時にそれらを対応します。

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

### チェックボックス / ラジオグループ

複数のチェックボックスやラジオ入力を`register()`の引数に要素の配列をグループとして渡すことで登録できます。
セットアップでネイティブの入力の集まりを描画するタイミングで、グループのロジックを再実装することなく再利用したい時に役立ちます。

```jsx
<CustomCheckboxGroup
  ref={(el) => control.register(el?.querySelectorAll('input'))}>
  value={control.options}
  onChange={(options) => control.change(options)}
  onBlur={() => control.blur()}
/>
```

もし既存のネイティブ入力を再利用する必要がない場合、1つのhiddenに設定されたマルチセレクトかテキスト入力でグループを置き換えることができます。チェックボックスやラジオのグループの完全な実装例は[React Aria example](../../../../examples/react-aria/)を参考にしてください。