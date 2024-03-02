# FormProvider

フォームコンテキストのための [Context Provider](https://react.dev/reference/react/createContext#provider) をレンダリングする React コンポーネントです。 [useField](./useField.md) や [useFormMetadata](./useFormMetadata.md) フックを使用したい場合には必須です。

```tsx
import { FormProvider, useForm } from '@conform-to/react';

export default function SomeParent() {
  const [form, fields] = useForm();

  return <FormProvider context={form.context}>{/* ... */}</FormProvider>;
}
```

## プロパティ

### `context`

フォームコンテキストです。これは [useForm](./useForm.md) で作成され、 `form.context` を通じてアクセスできます。

## Tips

### FormProvider は、フォームの直接の親である必要はありません。

入力が [form属性](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#instance_properties_related_to_the_parent_form) を通じて関連付けられている限り、フォームの外部のどこにでも自由に入力を配置できます。

```tsx
function Example() {
  const [form, fields] = useForm();
  return (
    <FormProvider context={form.context}>
      <div>
        <form id={form.id} />
      </div>
      <div>
        <input name={fields.title.name} form={form.id} />
      </div>
    </FormProvider>
  );
}
```

### FormProvider はネストすることができます

これは、レイアウトの制約のために1つのフォームを別のフォームの内部に配置する必要がある場合に便利です。

```tsx
import { FormProvider, useForm } from '@conform-to/react';

function Field({ name, formId }) {
  //  formId が指定されていない場合、 useField は最も近い FormContext を探します。
  const [meta] = useField(name, { formId });

  return <input name={meta.name} form={meta.form} />;
}

function Parent() {
  const [form, fields] = useForm({ id: 'parent' });
  return (
    <FormProvider context={form.context}>
      <form id={form.id} />

      <Field name={fields.category.name} />
      <Child />
    </FormProvider>
  );
}

function Child() {
  const [form, fields] = useForm({ id: 'child' });

  return (
    <FormProvider context={form.context}>
      <form id={form.id} />
      <Field name={fields.title.name} />

      {/* これは代わりに 'id' が 'parent' のフォームコンテキストを探します。 */}
      <Field name={fields.bar.name} formId="parent" />
    </FormProvider>
  );
}
```
