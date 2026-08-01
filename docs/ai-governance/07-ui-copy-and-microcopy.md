# UIコピーとマイクロコピー

## 基本原則

ユーザーの言葉と具体語を使い、操作labelは結果を示します。errorは責めずに回復を示し、空状態は次行動を示し、リスクを正確に伝えます。特定のMidjourney versionやサービス状態を誤認させる表記は禁止します。

## 操作label

`OK`、`実行`、`送信`だけで終わらせず、対象と結果を示します。削除、外部送信、LLM解析、Patch適用では対象・範囲・影響が予測できるlabelにします。

## error

何が起きたか、原因候補、影響、入力やデータが保持されるか、回復手段を示します。API未設定、network timeout、rate limit、schema mismatch、cancelled job、asset欠損を同じ汎用errorへ潰しません。

## 空・無効・成功

- 初回の空、検索結果なし、error、権限不足を区別し、次行動を示す。
- disabledは理由と有効化条件を伝える。tooltipだけに依存しない。
- successは何が保存・copy・export・適用されたかと次行動を示す。

## toneと用語

ユーザーを責めず、不必要に怖がらせず、保証できない安心を与えません。Prompt、Ruleset、Capability Profile、Patch、Referenceなどは `docs/ui-spec.md` と文字列resourceへ寄せ、内部IDやagent実装名を不用意に表示しません。
