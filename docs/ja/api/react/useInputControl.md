# useInputControl

ブラウザイベントの発火を制御できる React フックです。Conform にカスタム input を組み込みたい場合に便利です。

```tsx
const control = useInputControl(metaOrOptions);
```

## 例

```tsx
import { useForm, useInputControl } from '@conform-to/react';
import { Select, Option } from './custom-ui';

function Example() {
  const [form, fields] = useForm();
  const color = useInputControl(fields.color);

  return (
    <Select
      name={fields.color.name}
      value={color.value}
      onChange={color.change}
      onFocus={color.focus}
      onBlur={color.blur}
    >
      <Option value="red">Red</Option>
      <Option value="green">Green</Option>
      <Option value="blue">Blue</Option>
    </Select>
  );
}
```

## パラメーター

### `metaOrOptions`

フィールドメタデータ、または `key` 、 `name` 、 `formId` 、 `initialValue` を含むオプションオブジェクトです。

## 戻り値

input コントロールです。これにより、入力値と 3 種類のイベントディスパッチャーの両方にアクセスできます。

### `value`

input の値です。これを使用して、制御された input を設定することができます。

### `change(value: string)`

値を変更する必要があるときに呼び出されるメソッドです。これにより、新しい値を持つ入力の代わりに [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) イベントと [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) イベントの両方がディスパッチされます。

### `blur()`

ユーザーが input から離れたときに呼び出されるメソッドです。これにより、入力の代わりに [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) イベントと [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) イベントの両方がディスパッチされます。

### `focus()`

このメソッドは、 input にフォーカスが当たったときに呼び出されます。これにより、入力の代わりに [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) イベントと [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) イベントの両方がディスパッチされます。

## Tips

### フォーカス移譲

送信に失敗した場合、Conform は最初の無効な input 要素にフォーカスします。しかし、カスタム input を使用している場合、これは機能しないかもしれません。これを修正するには、フォーカスイベントをリスニングして、希望する要素に対して `element.focus()` をトリガーすることで、input 要素からフォーカスを転送できます。

```tsx
import { useForm, useInputControl } from '@conform-to/react';
import { Select, Option } from './custom-ui';

function Example() {
  const [form, fields] = useForm();
  const inputRef = useRef(null);
  const color = useInputControl(fields.color);

  return (
    <>
        <input
            name={fields.color.name}
            defaultValue={fields.color.initialValue}
            className="sr-only"
            tabIndex={-1}
            onFocus={() => inputRef.current?.focus()}
        />
        <Select
            ref={inputRef}
            value={color.value}
            onChange={color.change}
            onFocus={color.focus}
            onBlur={color.blur}
        >
            <Option value="red">Red</Option>
            <Option value="green">Green</Option>
            <Option value="blue">Blue</Option>
        </Select>
    <>
  );
}
```

上記の例では、カスタム入力によってレンダリングされる内部の入力を制御できないため、カスタムセレクトコンポーネントに `name` プロパティを渡す代わりに、手動で非表示の入力を設定しています。入力は視覚的には隠されていますが、 [tailwindcss](https://tailwindcss.com/docs/screen-readers#screen-reader-only-elements) からの **sr-only** クラスのおかげで依然としてフォーカス可能です。入力がフォーカスされたとき、 `inputRef.current?.focus()` を呼び出してカスタム入力へフォーカスを委譲します。

もし tailwindcss を使用していない場合は、好みのスタイリングソリューションから同様のユーティリティを探すか、または以下のスタイルを適用して **sr-only** クラスの実装に基づいた対応を行うことができます:

```tsx
const style = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};
```
