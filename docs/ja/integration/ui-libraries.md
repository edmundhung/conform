# UI ライブラリとのインテグレーション

このガイドでは、カスタム入力コンポーネントを Conform とインテグレーションする方法を紹介します。

## イベント移譲

Conform は、ドキュメントに直接 **input** と **focusout** イベントリスナーをアタッチすることで、すべてのネイティブ入力をサポートしています。 `<input />` 、 `<select />` 、または `<textarea />` 要素にイベントハンドラーを設定する必要はありません。唯一の要件は、 `<form />` 要素にフォーム **id** を設定し、すべての入力に **name** 属性が設定されていて、 [form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form) 属性を使用するか、 `<form />` 要素内にネストすることでフォームに関連付けられていることです。

```tsx
function Example() {
  const [form, fields] = useForm({
    // オプション。指定されていない場合は Conform がランダムなIDを生成します。
    id: 'example',
  });

  return (
    <form id={form.id}>
      <div>
        <label>Title</label>
        <input type="text" name="title" />
        <div>{fields.title.errors}</div>
      </div>
      <div>
        <label>Description</label>
        <textarea name="description" />
        <div>{fields.description.errors}</div>
      </div>
      <div>
        <label>Color</label>
        <select name="color">
          <option>Red</option>
          <option>Green</option>
          <option>Blue</option>
        </select>
        <div>{fields.color.errors}</div>
      </div>
      <button form={form.id}>Submit</button>
    </form>
  );
}
```

## インテグレーションが必要かどうかの判別

Conform は[イベント移譲](#event-delegation)に依存してフォームをバリデートし、フォームイベントを発行する限り、どのようなカスタム入力とも動作します。これは通常、 `<Input />` や `<Textarea />` のように、ネイティブの入力要素をラップするだけのシンプルなコンポーネントに対して当てはまります。しかし、 `<Select />` や `<DatePicker />` のようなカスタム入力コンポーネントでは、ユーザーが非ネイティブのフォーム要素で操作し、隠された入力を使うため、フォームイベントが発行されない可能性が高いです。

入力がネイティブ入力かどうかを識別するために、カスタム入力を操作している間にフォームイベントが発行され、バブルアップするかどうかを確認するために、イベントリスナーを添付した div で入力をラップすることができます。また、以下にはいくつかの人気のある UI ライブラリに関する [例](#examples) も掲載されています。

```tsx
import { CustomInput } from 'your-ui-library';

function Example() {
  return (
    <div onInput={console.log} onBlur={console.log}>
      <CustomInput />
    </div>
  );
}
```

## `useInputControl` を使用してカスタム入力コンポーネントを強化する

この問題を解決するために、 Conform は [useInputControl](../api/react/useInputControl.md) というフックを提供しています。これにより、必要なときにフォームイベントを発行するようにカスタム入力を強化できます。このフックは以下のプロパティを持つコントロールオブジェクトを返します:

- `value`: フォームの[リセットおよび更新のインテント](../intent-button.md#reset-and-update-intent)に対応した、入力の現在の値
- `change`: 現在の値を更新し、`change` および `input` イベントの両方を発行するための関数
- `focus`: `focus` および `focusin` イベントを発行するための関数
- `blur`: `blur` および`focusout` イベントを発行するための関数

以下は、Radix UI の[Select コンポーネント](https://www.radix-ui.com/primitives/docs/components/select)をラップする例です:

```tsx
import {
  type FieldMetadata,
  useForm,
  useInputControl,
} from '@conform-to/react';
import * as Select from '@radix-ui/react-select';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons';

type SelectFieldProps = {
  // `FieldMetadata` 型を使用して `meta` プロパティを定義し、
  // そのジェネリクスを通じて受け入れるフィールドの型を制限することができます。
  meta: FieldMetadata<string>;
  options: Array<string>;
};

function SelectField({ meta, options }: SelectFieldProps) {
  const control = useInputControl(meta);

  return (
    <Select.Root
      name={meta.name}
      value={control.value}
      onValueChange={(value) => {
        control.change(value);
      }}
      onOpenChange={(open) => {
        if (!open) {
          control.blur();
        }
      }}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton>
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option} value={option}>
                <Select.ItemText>{option}</Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton>
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <div>
        <label>Currency</label>
        <SelectField meta={fields.color} options={['red', 'green', 'blue']} />
        <div>{fields.color.errors}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}
```

## フォームコンテキストでシンプルに

[useField](../api/react/useField.md) フックを [FormProvider](../api/react/FormProvider.md) と共に使用することで、ラッパーコンポーネントをさらにシンプルにすることもできます。

```tsx
import {
  type FieldName,
  FormProvider,
  useForm,
  useField,
  useInputControl,
} from '@conform-to/react';
import * as Select from '@radix-ui/react-select';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons';

type SelectFieldProps = {
  // `FieldMetadata` 型の代わりに `FieldName` 型を使用します。
  // また、そのジェネリクスを通じて受け入れるフィールドの型を制限することもできます。
  name: FieldName<string>;
  options: Array<string>;
};

function Select({ name, options }: SelectFieldProps) {
  const [meta] = useField(name);
  const control = useInputControl(meta);

  return (
    <Select.Root
      name={meta.name}
      value={control.value}
      onValueChange={(value) => {
        control.change(value);
      }}
      onOpenChange={(open) => {
        if (!open) {
          control.blur();
        }
      }}
    >
      {/* ... */}
    </Select.Root>
  );
}

function Example() {
  const [form, fields] = useForm();

  return (
    <FormProvider context={form.context}>
      <form id={form.id}>
        <div>
          <label>Color</label>
          <Select name={fields.color.name} options={['red', 'green', 'blue']} />
          <div>{fields.color.errors}</div>
        </div>
        <button>Submit</button>
      </form>
    </FormProvider>
  );
}
```

## 例

こちらでは、いくつかの人気のある UI ライブラリとの統合例を見ることができます。

> Radix UI や React Aria Component など、さらに多くの UI ライブラリの例を準備するためのコントリビューターを探しています。

- [Chakra UI](../../examples/chakra-ui/)
- [Headless UI](../../examples/headless-ui/)
- [Material UI](../../examples/material-ui/)
- [Radix UI](../../examples/radix-ui/)
- [Shadcn UI](../../examples/shadcn-ui/)
