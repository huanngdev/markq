# MarkQ

MarkQ là ứng dụng trắc nghiệm mã nguồn mở: viết đề bằng Markdown trong Obsidian, đặt file vào project và làm/review ngay trên web. Đáp án chỉ được gửi cho trình duyệt sau khi nộp bài; kết quả và snapshot từng lần làm được lưu bằng SQLite.

## Tính năng

- Đọc nhiều đề từ `content/quizzes/*.md`.
- Trắc nghiệm một đáp án, một câu mỗi màn hình, không giới hạn thời gian.
- Chuyển câu nhanh bằng sidebar; responsive trên tablet/mobile.
- Chấm điểm ở server, không tin điểm hoặc đáp án từ client.
- Review lựa chọn của bạn, đáp án đúng và lời giải Markdown.
- Lưu mọi lần làm vào SQLite; chỉnh file đề không làm thay đổi review cũ.
- Validator CLI và project skill để tạo file đề đúng format.

## Chạy local

Yêu cầu Bun 1.3.14 trở lên.

```bash
bun install
cp .env.example .env.local
bun run db:migrate
bun dev
```

Mở [http://localhost:3000](http://localhost:3000). App cũng tự áp dụng migration còn thiếu khi kết nối database lần đầu.

## Thêm đề Markdown

Tạo một file trong `content/quizzes`, ví dụ:

```md
---
id: javascript-basic
title: JavaScript Fundamentals
description: Test foundational JavaScript knowledge.
tags:
  - javascript
published: true
---

# JavaScript Fundamentals

## q1

### Question

What does `typeof null` return?

### Options

- [ ] A. `null`
- [ ] B. `object`
- [ ] C. `undefined`
- [ ] D. `number`

### Answer

B

### Explanation

This is historical JavaScript behavior. `null` is a primitive value, but `typeof null` returns `"object"`.
```

Kiểm tra toàn bộ đề:

```bash
bun run quiz:validate
```

Quy tắc đầy đủ nằm tại [format reference](.agents/skills/markq-quiz-author/references/format.md). Hai đề mẫu trong `content/quizzes` có thể dùng làm tài liệu trực tiếp.

Lưu ý quan trọng:

- ID đề phải duy nhất và dùng kebab-case.
- Không đổi ID đề/câu sau khi đã có kết quả nếu muốn giữ liên kết lịch sử.
- Mỗi câu có đúng một đáp án; mọi lựa chọn nằm trên một dòng Markdown.
- `published: false` giữ đề trong repo nhưng không hiển thị trên web.

## Skill đi kèm

Repo cài sẵn ba project skill trong `.agents/skills`:

- `markq-quiz-author`: tạo, sửa và validate đề MarkQ; có template và generator JSON → Markdown.
- `vercel-react-best-practices`: hướng dẫn React/Next.js từ Vercel Engineering.
- `web-design-guidelines`: audit UI, responsive và accessibility theo Web Interface Guidelines.

Trong Codex, gọi skill riêng bằng prompt như:

```text
Use $markq-quiz-author to create a 20-question Vietnamese quiz about HTTP basics.
```

Hoặc dùng generator trực tiếp:

```bash
python3 .agents/skills/markq-quiz-author/scripts/generate_quiz.py --input quiz.json
bun run quiz:validate
```

Script không ghi đè file đã tồn tại nếu thiếu cờ `--force`.

## SQLite

Đường dẫn mặc định là `./data/markq.db`, cấu hình bằng `DATABASE_URL`. Các file database đã được gitignore.

Backup local đơn giản:

```bash
sqlite3 data/markq.db ".backup 'markq-backup.db'"
```

Khi deploy bằng container/serverless, cần gắn persistent volume cho thư mục `data`. Không dùng filesystem tạm nếu muốn giữ lịch sử sau lần deploy tiếp theo.

## Scripts

```bash
bun dev                # development server
bun run build          # production build
bun run lint           # ESLint
bun run typecheck      # strict TypeScript
bun test               # unit tests
bun run db:generate    # generate Drizzle migration after schema changes
bun run db:migrate     # apply SQLite migrations
bun run quiz:validate  # validate every Markdown quiz
```

## Kiến trúc

- Next.js App Router + React + TypeScript.
- Tailwind CSS và các component theo mô hình shadcn/ui (code nằm trong repo).
- Drizzle ORM + SQLite tích hợp trong Bun.
- `gray-matter`, `unified` và Remark cho Markdown.
- Zod cho validation ở parser và API.

Thiết kế, schema và phạm vi chi tiết nằm trong [PLAN.md](PLAN.md).

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md). MarkQ được phát hành theo giấy phép [MIT](LICENSE).
