# Kế hoạch xây dựng MarkQ

## 1. Mục tiêu

MarkQ là ứng dụng web mã nguồn mở để làm và review đề trắc nghiệm. Người dùng chỉ cần đặt các file Markdown đúng format vào một thư mục trong project, khởi động ứng dụng và chọn đề để làm trên web.

Phạm vi MVP:

- Next.js App Router + TypeScript.
- Giao diện bằng Tailwind CSS và shadcn/ui.
- Chỉ hỗ trợ câu hỏi trắc nghiệm một đáp án đúng.
- Đề, đáp án đúng và lời giải nằm trong file Markdown tương thích với Obsidian.
- Danh sách đề được đọc từ một thư mục local, không cần màn hình upload hay CMS.
- Kết quả và chi tiết từng lần làm bài được lưu trong SQLite.
- Có thể xem lại đáp án đã chọn, đáp án đúng và lời giải.
- Không có giới hạn thời gian, đăng nhập, phân quyền hoặc đồng bộ cloud trong MVP.

## 2. Trải nghiệm chính

### Chọn đề

Trang chủ hiển thị danh sách đề hợp lệ trong thư mục `content/quizzes`. Mỗi thẻ đề gồm:

- Tên đề.
- Mô tả ngắn.
- Chủ đề/tags.
- Số câu hỏi.
- Kết quả gần nhất và điểm cao nhất nếu đã từng làm.

Người dùng chọn một đề để mở trang làm bài.

### Làm bài

- Hiển thị một câu hỏi tại một thời điểm theo bố cục trong wireframe.
- Sidebar chứa bộ chọn đề và danh sách câu để chuyển nhanh giữa các câu.
- Mỗi câu chỉ được chọn một phương án.
- Có thể đổi lựa chọn trước khi nộp.
- Hiển thị tiến độ dạng `đã trả lời / tổng số câu`, không có timer.
- Khi nhấn **Nộp bài**, yêu cầu xác nhận nếu còn câu chưa trả lời.
- Chấm điểm ở server để đáp án đúng không phụ thuộc dữ liệu do client gửi lên.

### Xem kết quả và review

Sau khi nộp, trang kết quả hiển thị:

- Số câu đúng, tổng số câu và phần trăm.
- Số câu sai và chưa trả lời.
- Danh sách từng câu với lựa chọn của người dùng.
- Đáp án đúng.
- Lời giải/hướng dẫn.
- Nút làm lại đề và quay về danh sách đề.

Trang lịch sử hiển thị các lần làm trước và cho phép mở lại đúng kết quả của từng lần.

## 3. Đặc tả giao diện theo wireframe

### Nguyên tắc tổng thể

- Đường bo lớn ngoài cùng trong bản vẽ chỉ biểu diễn **ranh giới màn hình/viewport**, không phải border, card hay container. Khi implement, `body` phủ toàn màn hình với nền phẳng và tuyệt đối không render đường viền bao quanh trang.
- Giao diện desktop là một workspace làm bài tập trung, thoáng và cân đối. Nội dung nằm giữa màn hình trong một `max-width` khoảng 1400–1600px, có padding ngoài 24–40px tùy độ rộng viewport.
- Bố cục gồm hai hàng: thanh tiêu đề đề ở trên; bên dưới là sidebar hẹp ở trái và vùng làm bài lớn ở phải.
- Chỉ các khối chức năng bên trong mới có border: thanh tiêu đề, sidebar, vùng làm bài, khối câu hỏi và từng phương án.
- Dùng border mảnh, màu trung tính; bo góc rõ nhưng không phóng đại. Wireframe là sơ đồ vị trí, không yêu cầu nét vẽ tay hoặc border đen dày.
- Ưu tiên giao diện sạch theo shadcn/ui: nền trang dịu, bề mặt card sáng hơn một chút, typography dễ đọc, một màu accent duy nhất cho trạng thái tương tác.

### Bố cục desktop

```text
Viewport, không có border ngoài
┌──────────────────────────────────────────────────────────────┐
│                    Tên của đề đang làm                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌────────────────────────────────────────────┐
│ Chọn đề   ▾  │  │  Câu 3 / 20                               │
├──────────────┤  │  ┌──────────────────────────────────────┐  │
│ 01  ✓        │  │  │ Nội dung câu hỏi                    │  │
│ 02  ✓        │  │  └──────────────────────────────────────┘  │
│ 03  hiện tại │  │                                            │
│ 04  trống    │  │  ┌───────────────┐  ┌─────────────────┐   │
│ ...          │  │  │ A. Phương án  │  │ B. Phương án    │   │
│              │  │  └───────────────┘  └─────────────────┘   │
│              │  │  ┌───────────────┐  ┌─────────────────┐   │
│              │  │  │ C. Phương án  │  │ D. Phương án    │   │
│              │  │  └───────────────┘  └─────────────────┘   │
│              │  │                                            │
│ Đã làm 2/20  │  │  Trước                    Tiếp / Nộp bài   │
└──────────────┘  └────────────────────────────────────────────┘
```

- Thanh tiêu đề nằm trên cả hai cột, cùng mép trái/phải với workspace bên dưới. Nó hiển thị tên đề ở giữa; mô tả hoặc tag không chen vào khu vực này.
- Hàng nội dung dùng CSS Grid với sidebar khoảng 240–280px và vùng chính chiếm phần còn lại. Khoảng cách giữa hai cột khoảng 20–24px.
- Sidebar và vùng làm bài có chiều cao gần bằng nhau trên màn hình lớn. Vùng chính cần đủ cao để bố cục ổn định khi chuyển giữa câu ngắn và câu dài, nhưng được phép tăng chiều cao theo nội dung; không cắt nội dung để ép vừa viewport.

### Thanh chọn đề và sidebar câu hỏi

- Phần trên sidebar là `Select` của shadcn/ui, hiển thị tên đề hiện tại và icon chevron. Chọn đề khác sẽ điều hướng sang URL của đề đó; nếu đang có câu trả lời chưa nộp thì hiển thị hộp xác nhận trước khi rời trang.
- Một đường phân cách đặt ngay dưới bộ chọn đề, đúng như wireframe.
- Phần còn lại là danh sách câu có thể scroll độc lập khi đề dài. Không hiển thị toàn bộ nội dung câu hỏi ở đây; mỗi item chỉ cần số câu và trạng thái.
- Mỗi câu là một button có vùng bấm tối thiểu 40×40px. Các trạng thái phải nhận biết được bằng cả màu và ký hiệu:
  - `current`: nền accent nhẹ, border/ring accent, có `aria-current="step"`.
  - `answered`: có dấu check hoặc chấm đặc.
  - `unanswered`: trạng thái trung tính.
  - `flagged` được để ngoài MVP.
- Cuối sidebar có dòng tiến độ `Đã trả lời X/Y`, có thể sticky ở đáy để luôn nhìn thấy.

### Vùng làm bài chính

- Vùng chính là một panel bo góc lớn với padding rộng. Panel này tương ứng khung lớn bên phải trong wireframe.
- Phía trên panel có nhãn nhỏ `Câu X / Y`; bên dưới là khối câu hỏi riêng, rộng gần toàn panel, căn nội dung theo trái để đọc đoạn văn/code dễ hơn. Không căn giữa văn bản dài dù wireframe dùng chữ ở giữa để minh họa.
- Khối câu hỏi render Markdown an toàn và hỗ trợ paragraph, danh sách, ảnh, inline code và code block. Ảnh phải co theo chiều rộng, không làm tràn panel.
- Các phương án nằm dưới câu hỏi theo grid hai cột, đúng cấu trúc 2×2 trong wireframe khi có bốn lựa chọn. Nếu số lựa chọn lẻ, item cuối vẫn giữ một cột; không kéo giãn tùy tiện sang hai cột.
- Mỗi phương án là một button/card radio lớn, toàn bộ bề mặt có thể click, nội dung căn trái, chiều cao tối thiểu khoảng 88–104px. Mã `A`, `B`, `C`... có kiểu chữ nhấn mạnh hơn nội dung.
- Với lựa chọn dài hoặc chứa code/ảnh, card tự tăng chiều cao và các item cùng hàng dùng chiều cao bằng item dài hơn.
- Không hiển thị radio tròn mặc định nếu làm giao diện rối; có thể dùng toàn bộ card như `RadioGroupItem`, nhưng vẫn phải giữ đúng semantics và điều khiển được bằng bàn phím.

### Trạng thái tương tác

- `default`: border trung tính, nền surface.
- `hover`: border đậm hơn và nền đổi nhẹ; không làm layout dịch chuyển.
- `focus-visible`: ring accent rõ ràng bên ngoài card.
- `selected`: border accent, nền accent rất nhạt và có check icon.
- Trong lúc làm bài không dùng màu xanh/đỏ để tiết lộ đúng sai.
- Ở trang review: đáp án đúng dùng xanh kèm check; lựa chọn sai của người dùng dùng đỏ kèm dấu X; đáp án đúng nhưng không được chọn vẫn phải được đánh dấu rõ. Màu luôn đi kèm icon và text như `Đáp án đúng`/`Bạn đã chọn` để hỗ trợ người mù màu.

### Điều hướng và nộp bài

- Wireframe chưa vẽ các control bắt buộc này; đặt chúng ở hàng cuối panel để không phá bố cục: nút `Câu trước` bên trái, `Câu tiếp theo` bên phải.
- Ở câu cuối, thay `Câu tiếp theo` bằng nút primary `Nộp bài`. Người dùng vẫn có thể nhảy câu bằng sidebar.
- Việc chọn đáp án không tự chuyển câu để tránh thao tác ngoài ý muốn.
- Nếu còn câu trống, hộp xác nhận nộp bài hiển thị số câu chưa trả lời và cho phép quay lại hoặc vẫn nộp.

### Responsive

- Từ 1024px trở lên: giữ bố cục sidebar + vùng chính và grid đáp án hai cột.
- Từ 768px đến dưới 1024px: sidebar thu gọn thành thanh điều hướng câu nằm ngang phía trên panel; bộ chọn đề vẫn ở trên thanh này.
- Dưới 768px: thanh tiêu đề gọn hơn; selector đề và nút mở danh sách câu nằm trên cùng; danh sách câu mở bằng `Sheet` từ trái hoặc dưới; đáp án chuyển thành một cột.
- Mobile không tạo border bao quanh toàn màn hình. Panel chính có thể giảm padding và radius, nhưng vẫn giữ khoảng chạm tối thiểu 44px và không có horizontal scroll.

### Trang kết quả và lịch sử

- Trang review tái sử dụng cùng shell: tiêu đề đề ở trên, danh sách câu ở sidebar, chi tiết một câu ở panel phải. Sidebar dùng trạng thái đúng/sai/chưa trả lời thay cho answered/unanswered.
- Trên panel review, đặt summary điểm phía trên câu hỏi hoặc thành một khối gọn ở đầu trang; sau đó giữ nguyên vị trí khối câu hỏi và lưới đáp án để chuyển từ làm bài sang review không gây cảm giác đổi giao diện hoàn toàn.
- Trang lịch sử và trang danh sách đề không cần ép vào layout làm bài. Chúng dùng card/list responsive thông thường, cùng typography, radius, màu và spacing token để giữ nhận diện thống nhất.

## 4. Format file Markdown

Mỗi đề là một file `.md` trong `content/quizzes`. File có YAML frontmatter và các heading cố định để parser dễ kiểm tra.

Ví dụ `content/quizzes/javascript-basic.md`:

```md
---
id: javascript-basic
title: JavaScript cơ bản
description: Kiểm tra kiến thức nền tảng về JavaScript.
tags:
  - javascript
  - beginner
published: true
---

# JavaScript cơ bản

## q1

### Câu hỏi

Kết quả của `typeof null` là gì?

### Lựa chọn

- [ ] A. `null`
- [ ] B. `object`
- [ ] C. `undefined`
- [ ] D. `number`

### Đáp án

B

### Lời giải

Đây là hành vi tồn tại từ các phiên bản JavaScript đầu tiên. `null` là giá trị nguyên thủy, nhưng `typeof null` trả về `"object"` vì lý do tương thích ngược.

## q2

### Câu hỏi

Phương thức nào thêm một phần tử vào cuối mảng?

### Lựa chọn

- [ ] A. `shift()`
- [ ] B. `unshift()`
- [ ] C. `push()`
- [ ] D. `pop()`

### Đáp án

C

### Lời giải

`push()` thêm một hoặc nhiều phần tử vào cuối mảng và trả về độ dài mới của mảng.
```

Quy ước bắt buộc:

- `frontmatter.id` là duy nhất và không đổi sau khi đề đã có kết quả.
- Mỗi câu dùng heading cấp 2 làm ID, ví dụ `## q1`; ID câu phải duy nhất trong đề.
- Mỗi câu có đúng bốn phần: `Câu hỏi`, `Lựa chọn`, `Đáp án`, `Lời giải`.
- Mỗi lựa chọn bắt đầu bằng mã duy nhất như `A.`, `B.`, `C.`, `D.`. Không bắt buộc chỉ có bốn lựa chọn.
- `Đáp án` chứa đúng một mã lựa chọn vì MVP chỉ hỗ trợ một đáp án đúng.
- Nội dung câu hỏi và lời giải được phép dùng Markdown, ảnh theo đường dẫn tương đối, inline code, code block và công thức nếu renderer hỗ trợ.
- Thứ tự file không quyết định thứ tự hiển thị; mặc định sắp xếp theo `title`.
- File có `published: false` không xuất hiện trên web.

Parser phải trả lỗi rõ ràng gồm tên file, ID câu và nguyên nhân. Một file lỗi bị bỏ qua khỏi danh sách đề nhưng lỗi vẫn được log khi chạy development/build.

## 5. Kiến trúc đề xuất

### Stack

- Next.js App Router, TypeScript.
- shadcn/ui + Tailwind CSS.
- SQLite.
- Drizzle ORM và migration bằng `drizzle-kit`.
- `gray-matter` để đọc frontmatter.
- `unified`/`remark` để parse và render Markdown an toàn.
- Zod để validate dữ liệu sau khi parse.

### Các lớp chính

1. **Quiz content**: đọc file từ `content/quizzes`, parse, validate và trả về model `Quiz`.
2. **Application service**: lấy danh sách đề, lấy chi tiết đề, chấm điểm và tạo attempt.
3. **Persistence**: Drizzle repository lưu/đọc các lần làm bài trong SQLite.
4. **UI**: Server Components cho trang đọc dữ liệu; Client Components cho form làm bài và tương tác lựa chọn.

Model dùng trên trang làm bài là `PublicQuiz`, chỉ gồm câu hỏi và các lựa chọn. `correctOption` và `explanation` phải được loại bỏ ở lớp server trước khi truyền props cho Client Component, không chỉ ẩn bằng CSS hoặc JavaScript. Module đọc đề đầy đủ được đánh dấu server-only và chỉ API chấm điểm/trang review được phép sử dụng.

Không lưu nguyên đề vào database. SQLite chỉ lưu snapshot cần thiết của lần làm để lịch sử không bị mất ý nghĩa nếu file đề thay đổi. Snapshot gồm tiêu đề đề, nội dung câu hỏi, các lựa chọn, lựa chọn của người dùng, đáp án đúng và lời giải tại thời điểm nộp.

## 6. Dữ liệu SQLite

### `attempts`

- `id`: text/UUID, primary key.
- `quiz_id`: ID từ frontmatter.
- `quiz_title`: snapshot tên đề.
- `correct_count`: số câu đúng.
- `incorrect_count`: số câu sai.
- `unanswered_count`: số câu bỏ trống.
- `total_questions`: tổng số câu.
- `score_percent`: số nguyên từ 0 đến 100.
- `submitted_at`: thời điểm nộp.

### `attempt_answers`

- `id`: text/UUID, primary key.
- `attempt_id`: foreign key tới `attempts`, xóa cascade.
- `question_id`: ID câu trong file Markdown.
- `question_order`: vị trí câu tại thời điểm làm.
- `question_snapshot`: nội dung câu hỏi dạng Markdown.
- `options_snapshot`: JSON chứa danh sách mã và nội dung lựa chọn.
- `selected_option`: nullable nếu bỏ trống.
- `correct_option`: mã đáp án đúng.
- `is_correct`: boolean.
- `explanation_snapshot`: lời giải dạng Markdown.

Index cần có:

- `attempts(quiz_id, submitted_at)` để lấy lịch sử và kết quả gần nhất.
- `attempt_answers(attempt_id, question_order)` để render trang review đúng thứ tự.

## 7. Routes và màn hình

- `/`: danh sách đề và tóm tắt kết quả đã làm.
- `/quiz/[quizId]`: trang làm đề.
- `/attempts`: lịch sử tất cả lần làm.
- `/attempts/[attemptId]`: kết quả và review chi tiết.
- `POST /api/attempts`: nhận `quizId` và map `questionId -> selectedOption`, đọc lại đề ở server, chấm điểm, lưu transaction và trả về `attemptId`.

API không nhận đáp án đúng hoặc điểm số từ client. Sau khi lưu thành công, client điều hướng tới `/attempts/[attemptId]`.

## 8. Cấu trúc thư mục dự kiến

```text
app/
  api/attempts/route.ts
  attempts/page.tsx
  attempts/[attemptId]/page.tsx
  quiz/[quizId]/page.tsx
  layout.tsx
  page.tsx
components/
  quiz-card.tsx
  quiz-form.tsx
  question-card.tsx
  result-summary.tsx
  answer-review.tsx
content/
  quizzes/
    example.md
db/
  migrations/
  schema.ts
lib/
  db.ts
  quizzes/parser.ts
  quizzes/repository.ts
  quizzes/schema.ts
  attempts/service.ts
  attempts/repository.ts
  markdown.tsx
data/
  .gitkeep
```

File SQLite mặc định đặt tại `data/markq.db` và được thêm vào `.gitignore`. Cấu hình đường dẫn bằng biến môi trường `DATABASE_URL=file:./data/markq.db`.

## 9. Các giai đoạn triển khai

### Giai đoạn 1: Khởi tạo nền tảng

- Tạo project Next.js TypeScript.
- Cài Tailwind, shadcn/ui, Drizzle, SQLite, Zod và các thư viện Markdown.
- Tạo layout, theme cơ bản, database schema, migration và script khởi tạo DB.
- Thêm `.env.example`, `.gitignore` và hướng dẫn chạy local.

Điều kiện hoàn thành: app chạy local, database được tạo bằng một lệnh và các trang khung render thành công.

### Giai đoạn 2: Markdown quiz engine

- Định nghĩa TypeScript/Zod schema cho quiz, question và option.
- Viết parser cho format ở mục 4.
- Resolve ảnh tương đối từ thư mục đề.
- Thêm một đề mẫu hợp lệ và fixtures lỗi.
- Viết unit test cho parser: file hợp lệ, trùng ID, thiếu đáp án, đáp án không tồn tại, thiếu lời giải và frontmatter lỗi.

Điều kiện hoàn thành: đặt file hợp lệ vào `content/quizzes` thì đề xuất hiện; file lỗi bị từ chối với thông báo cụ thể.

### Giai đoạn 3: Danh sách đề và làm bài

- Xây trang danh sách đề.
- Xây shell làm bài theo wireframe: title bar, sidebar, panel câu hỏi và lưới đáp án.
- Xây điều hướng một câu mỗi lần bằng sidebar và nút trước/tiếp theo.
- Xây card đáp án bằng radio group và progress.
- Giữ câu trả lời trong state của form.
- Chuyển `Quiz` thành `PublicQuiz` ở server trước khi render form.
- Validate payload ở cả client và server.
- Xử lý trạng thái loading, lỗi và xác nhận khi còn câu bỏ trống.

Điều kiện hoàn thành: người dùng chọn được đề, trả lời, đổi lựa chọn và nộp bài; đáp án/lời giải chưa bị render trên trang làm bài.

### Giai đoạn 4: Chấm điểm và lưu kết quả

- Viết service chấm điểm từ bản đề được đọc tại server.
- Lưu `attempts` và `attempt_answers` trong một SQLite transaction.
- Tạo trang kết quả và review.
- Tạo trang lịch sử và thống kê gần nhất/cao nhất trên danh sách đề.

Điều kiện hoàn thành: refresh hoặc khởi động lại app vẫn xem được lịch sử và đầy đủ snapshot của lần làm.

### Giai đoạn 5: Hoàn thiện và phát hành mã nguồn mở

- Thêm empty state, not-found, error boundary và responsive mobile.
- Kiểm tra accessibility: label cho radio, focus state, keyboard navigation, semantic heading và màu sắc đủ tương phản.
- Thêm test cho logic chấm điểm và integration test cho API nộp bài.
- Viết README: cài đặt, format đề, thêm ảnh, chạy migration, backup database và deploy với persistent volume.
- Thêm license, contributing guide và CI chạy lint/typecheck/test.

Điều kiện hoàn thành: một người mới có thể clone repo, thêm đề Markdown và chạy ứng dụng theo README mà không cần sửa code.

## 10. Quy tắc chấm điểm

- Mỗi câu có trọng số bằng nhau.
- Đúng: `selected_option === correct_option`.
- Sai: đã chọn nhưng không trùng đáp án.
- Chưa trả lời: không có lựa chọn.
- `score_percent = round(correct_count / total_questions * 100)`.
- Câu chưa trả lời được tính là không đúng nhưng vẫn thống kê riêng.
- Một lần nộp tạo một attempt mới; làm lại không ghi đè kết quả cũ.

## 11. Kiểm thử tối thiểu

- Parser đọc đúng Markdown, inline code, code block và Unicode tiếng Việt.
- Parser từ chối quiz/câu/lựa chọn trùng ID.
- Parser từ chối đáp án không thuộc danh sách lựa chọn.
- API không tin điểm hoặc đáp án đúng do client gửi.
- Nộp đủ, nộp thiếu và nộp toàn bộ câu trống đều cho kết quả đúng.
- Transaction không để lại attempt dở nếu lưu answer thất bại.
- Review vẫn hiển thị snapshot cũ sau khi file Markdown được chỉnh sửa.
- Lịch sử được sắp xếp mới nhất trước.
- Trang làm bài dùng được bằng bàn phím và trên màn hình mobile.
- Layout desktop bám sát wireframe nhưng không có border ngoài viewport.
- Ở tablet/mobile, sidebar chuyển đúng thành thanh ngang hoặc Sheet và đáp án không bị tràn ngang.

## 12. Ngoài phạm vi MVP

- Timer hoặc giới hạn thời gian.
- Tài khoản người dùng và đăng nhập.
- Upload/chỉnh sửa đề trong trình duyệt.
- Nhiều đáp án đúng, câu tự luận hoặc chấm điểm theo trọng số.
- Xáo trộn câu hỏi/lựa chọn.
- Import trực tiếp từ vault Obsidian bên ngoài project.
- Dashboard quản trị, analytics nâng cao hoặc đồng bộ cloud.

Các mục này có thể được bổ sung sau mà không làm thay đổi format cốt lõi; nếu thêm loại câu hỏi mới, nên thêm trường `type` vào từng câu và version cho format đề.

## 13. Tiêu chí hoàn thành MVP

- Thêm một file Markdown đúng format vào `content/quizzes` là đủ để đề xuất hiện trên web.
- Người dùng có thể chọn đề, làm toàn bộ câu trắc nghiệm và nộp không cần timer.
- Trang làm bài hiển thị một câu mỗi lần, có danh sách câu và lưới lựa chọn theo wireframe.
- Server chấm đúng và lưu kết quả cùng snapshot vào SQLite.
- Người dùng xem được tổng điểm, đáp án đúng, lựa chọn của mình và lời giải từng câu.
- Người dùng xem lại mọi lần làm sau khi reload hoặc restart ứng dụng.
- File đề lỗi không làm sập toàn bộ website và có log đủ rõ để sửa.
