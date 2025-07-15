# UI ライブラリとの統合

このガイドではConformとカスタムされた入力コンポーネントの統合方法を解説します。

## コンセプト

Conformは`input`、`focusout`や`reset`といったフォームイベントを利用した要素以外でのネイティブ入力をサポートしています。
これにより標準の要素（例：スタイリングされた`<input>`タグなど）をラップしたカスタムコンポーネントが特別な設定なしに機能するようにしています。

しかしながら`<Select />`や`<DatePicker />`、あるいはカスタムファイルアップローダーのようなより複雑な入力コンポーネントには抽象化レイヤーが含まれていることがあります。

これらのレイヤーはブラウザが発火するネイティブなフォームイベントに干渉し、Conformがユーザーのインタラクティブな入力を追跡するのを難しくします。

この問題を解決するために、Conformでは[`useControl`](../api/react/future/useControl.md)フックを提供しています.
これにより、hiddenに設定された標準の入力とカスタムされたUIコンポーネントを接続し、ユーザーの操作に反応してネイティブなイベントを発火させることができます。

## ネイティブ入力のエミュレーション

`useControl`と標準の入力を組み合わせる方法は複数あります。

- いくつかの場合において、**UIライブラリによって描画された入力コンポーネントの再利用**が可能です。 これはプログレッシブエンハンスメントの助けになります。例えば、ユーザーがスタイリングされたラベルをクリックした際に標準のHTMLの挙動を通してhiddenに設定されたチェックボックスの実体を切り替えます。JavaScriptがロードされていなかったとしてもフォームは正しく値を送信できます。

- とはいえ全ての入力においてこれができるわけではありません。いくつかのUIライブラリは見えない入力コンポーネントを描画し、完全に分離されたユーザー入力に対してJavaScriptを通じて値を更新します。これらの設定はJavaScriptがロードされるまで機能せず、予期せぬ順番でロードされることでイベントハンドラーが発火することがあります。例えば入力された値の更新前に`onChange`イベントが呼び出されることがあります。

- `useControl`自体がJavaScriptは必要とするため、ライブラリが提供する入力コンポーネントの再利用することの利点は大きくありません。もしあなたがプログレッシブエンハンスメントや期待される振る舞いについて自信がない場合、**UIライブラリ用に別の標準入力コンポーネントを描画すること**を推奨します。

`useControl` フックは入力された値を管理しフォームイベントを発火させるcontrolオブジェクトを提供します。統合するための手順は次の通りです。

1. **標準入力の登録**

  - hiddenに設定された入力要素（例：`<input hidden/>`）を描画し、`control.register()`を利用し登録してください。
  - これにより信頼できる入力値とネイティブフォームイベントを扱えます。

2. **イベント発火**
  - `control.change()`と`control.blur()`をカスタムコンポーネントの`onChange`と`onBlur`ハンドラーにそれぞれ渡して使うことができます。

3. **制御された状態にする**

  - `control.value`、`control.options`、`control.checked`あるいは`control.files`を使い、カスタムコンポーネントと現在の状態を同期できます。

4. （オプション）フォーカスを委譲する
  - 標準入力がhiddenに設定されている場合、`useControl`の`onFocus`コールバックを利用して、アクセシビリティ向けにフォーカスをカスタム入力に委譲できます。

### 実装例

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Input } from 'custom-ui-library';

function MyInput({ name, defaultValue }) {
  const control = useControl({ defaultValue });

  return (
    <>
      <input name={name} ref={control.register} hidden />
      <Input
        value={control.value}
        onChange={(value) => control.change(value)}
        onBlur={() => control.blur()}
      />
    </>
  );
}
```

### input typeの違い

入力タイプはフォームデータ

フォームの送信時、各入力タイプは異なる形でフォームデータに反映されます。以下はその簡単なまとめです。

- **テキスト入力**: 簡単です。値が空の場合、空文字列が渡されます。
- **チェックボックス / ラジオ**：
  - `value`が指定されていない場合、初期値は`'on'`になります.
  - チェックされた場合、値が送信され、チェックが外れた場合値が除外されます。
- **セレクト（単一）**：値が選ばれた選択肢が`value`になっているとき、最初の選択肢が初期値になります。
- **セレクト（複数）**：選択された複数の値を配列として表現します。何も選択されていない場合、値が存在しません。
- **ファイル入力**：1つかそれ以上の`File`オブジェクトが値として返ります。何も選択されていない場合、フィールドが削除されます。
- **その他入力**：テキスト入力と同じ振る舞いをします。該当の`type`がコンテキストを追加することがありますが、送信される値には影響しません。

## 実装例

一般的なUIライブラリと統合する際の例をいくつか紹介します。

- [React Aria Components](../../examples/react-aria/)
- [Shadcn UI](../../examples/shadcn-ui/)
- [Radix UI](../../examples/radix-ui/)
- [Chakra UI](../../examples/chakra-ui/)
- [Headless UI](../../examples/headless-ui/)
- [Material UI](../../examples/material-ui/)

あなたが使っているライブラリがリストにないか、あるいはissueにも挙がっていない場合、[discussonを作成](https://github.com/edmundhung/conform/discussions) してください。

実装例を共有したい場合、コントリビューションも受け入れています。
