# Contributing to MarkQ

Cảm ơn bạn muốn đóng góp cho MarkQ.

## Trước khi gửi thay đổi

```bash
bun run quiz:validate
bun run lint
bun run typecheck
bun test
bun run build
```

- Giữ MVP tập trung vào trắc nghiệm một đáp án và file Markdown local.
- Không đưa đáp án/lời giải vào `PublicQuiz` hoặc props của trang làm bài.
- Khi đổi database schema, chạy `bun run db:generate` và commit migration mới.
- Khi đổi format Markdown, cập nhật đồng thời parser, test, đề mẫu và `.agents/skills/markq-quiz-author`.
- Thêm test cho lỗi parser hoặc logic chấm điểm mới.

## Báo lỗi

Mô tả môi trường, bước tái hiện, kết quả mong đợi và kết quả thực tế. Với file đề lỗi, gửi một ví dụ tối thiểu không chứa dữ liệu nhạy cảm.
