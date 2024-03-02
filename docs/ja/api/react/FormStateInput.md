# FormStateInput

ドキュメントの再読み込みが発生した場合にフォームの状態を維持するために、非表示の入力をレンダリングするReactコンポーネントです。

```tsx
import { FormProvider, FormStateInput, useForm } from '@conform-to/react';

export default function SomeParent() {
  const [form, fields] = useForm();

  return (
    <FormProvider context={form.context}>
      <FormStateInput />
    </FormProvider>
  );
}
```

## プロパティ

このコンポーネントはプロパティを受け入れません。

## Tips

### 完全なプログレッシブエンハンスメントを求めている場合にのみ、これが必要です。

ドキュメントが再読み込みされると、フォームの状態の一部が失われます。例えば、 Conform は検証されたフィールドのエラーのみを表示しますが、新しいフィールドをリストに挿入するなど、サブミット以外の意図でフォームを送信している場合、この情報は失われます。 FormStateInput をレンダリングすることで、 Conform はフォームの状態を復元し、検証されたすべてのフィールドのエラーが引き続き表示されることを保証できます。
