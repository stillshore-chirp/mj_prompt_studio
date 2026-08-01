# Issue #20: 狭幅で消失するメイン作業領域を再flowする

- [x] 760px幅でmainへ最小高を与える。
- [x] Settings、Inspector、Jobsへスクロールで到達できる。
- [x] 横方向overflowを作らない。
- [x] 安全なmock画面証跡を取得する。

検証: client lint/typecheck/test/build、760px Playwright、`git diff --check`、governance verification。
