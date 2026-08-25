# MarkQ — Legacy Product and Implementation Plan

> **Trạng thái:** Đây là kế hoạch lịch sử của ứng dụng MarkQ, được lưu để tham khảo và không phải đặc tả hiện hành. Nhiều quyết định bên dưới không còn đúng (đặc biệt format hai file, npm/npx, localStorage và việc không dùng database). Xem `docs/SCALING.md`, `README.md`, `src/lib/quizzes/parser.ts` và `.agents/skills/markq-quiz-author/references/format.md` để biết kiến trúc và format hiện tại.

> Tài liệu này không chứa hướng dẫn riêng cho bộ đề EVN. Workspace tạo đề EVN cục bộ nằm ngoài tài liệu ứng dụng và không được Git theo dõi.

## 1. Tóm tắt sản phẩm

**MarkQ** là công cụ mã nguồn mở, local-first, chuyển các bộ đề viết bằng Markdown thành giao diện web trắc nghiệm có chấm điểm và lời giải.

Tagline:

> Turn Markdown into quizzes, locally.

Ứng dụng được xây dựng bằng **một project Next.js duy nhất** và phát hành thành CLI `markq` trên npm. Không dùng Turborepo, monorepo, backend riêng, database hay dịch vụ cloud trong MVP.

Workspace hiện có các đề ôn thi vòng 1 Điện lực miền Nam. Người dùng được miễn Tin học; nội dung mặc định chỉ gồm:

- Anh văn
- IQ

MarkQ phải được thiết kế đủ tổng quát để có thể mở nguồn và dùng với các bộ đề khác, nhưng MVP phải hoạt động tốt với định dạng Markdown đang có trong `de-mau/`.

## 2. Vấn đề cần giải quyết

Các bộ đề hiện được lưu thành hai file Markdown:

1. File câu hỏi, ví dụ `de-so-01-cau-hoi.md`.
2. File đáp án và lời giải, ví dụ `de-so-01-dap-an-va-goi-y.md`.

Việc làm bài trực tiếp trên Markdown không có đồng hồ, kiểm tra câu bỏ trống, chấm điểm, lịch sử kết quả hoặc chế độ xem lại câu sai. MarkQ bổ sung lớp giao diện và logic làm bài mà không buộc tác giả phải nhập lại đề vào giao diện quản trị.

Luồng chính:

```text
Markdown câu hỏi + Markdown đáp án
                ↓
       parser và validator
                ↓
          dữ liệu Quiz
                ↓
       giao diện làm bài
                ↓
     kết quả + lời giải + lịch sử local
```

## 3. Mục tiêu MVP

MVP được xem là hoàn thành khi người dùng có thể:

1. Khởi tạo thư mục nội dung bằng `npx markq init`.
2. Chạy ứng dụng local bằng `npx markq serve` mà không cần clone source code MarkQ.
3. Kiểm tra toàn bộ file Markdown bằng `npx markq validate` trước khi mở web.
4. Xem danh sách các đề hợp lệ được tìm thấy trong thư mục nội dung.
5. Chọn một đề và làm lần lượt toàn bộ câu hỏi.
6. Chọn một đáp án cho mỗi câu, chuyển câu và quay lại sửa đáp án.
7. Theo dõi tiến độ, thời gian đã làm và các câu chưa trả lời.
8. Nộp bài sau bước xác nhận.
9. Xem tổng điểm, số câu đúng/sai/bỏ trống và thời gian hoàn thành.
10. Xem lại từng câu cùng đáp án đã chọn, đáp án đúng, gợi ý và lời giải.
11. Làm lại toàn bộ đề hoặc chỉ làm lại các câu sai.
12. Xem lịch sử các lần làm bài được lưu trong trình duyệt.
13. Thêm một cặp file Markdown đúng quy ước rồi thấy đề mới xuất hiện mà không sửa code giao diện.
14. Cài bản đóng gói từ npm và nhận cùng hành vi như khi chạy trong repository của maintainer.

## 4. Ngoài phạm vi MVP

Không triển khai các phần sau nếu chưa có yêu cầu mới:

- Đăng nhập hoặc tài khoản người dùng.
- Database, API server riêng hoặc đồng bộ kết quả giữa các thiết bị.
- Bảng điều khiển giáo viên hoặc quản trị nội dung.
- Chống gian lận hoặc bảo mật đáp án trước người có quyền xem source code.
- AI tự sinh câu hỏi trong runtime.
- Upload file qua trình duyệt.
- Thi nhiều người theo thời gian thực.
- Xếp hạng, mạng xã hội hoặc gamification phức tạp.
- Turborepo, workspace packages hoặc chia thành nhiều ứng dụng.
- CLI plugin system hoặc marketplace theme.
- Static export thành một file HTML duy nhất.
- Môn Tin học trong dữ liệu ôn tập mặc định.

MarkQ là công cụ tự luyện local. Đáp án có thể tồn tại trong bundle hoặc filesystem và không được xem là bí mật.

## 5. Quyết định kỹ thuật

### 5.1 Nền tảng

- Next.js với App Router.
- React và TypeScript ở chế độ strict.
- Một `package.json` duy nhất tại root.
- Contributor chạy source bằng `npm run dev`; người dùng cuối chạy bản npm bằng `npx markq serve`.
- CLI là một Node executable nhỏ nằm trong cùng repository và được khai báo qua trường `bin` của `package.json`.
- Bản npm chứa Next.js standalone server đã build sẵn; máy người dùng không phải build lại source Next.js để làm bài.
- Ưu tiên Server Components cho việc đọc catalog và nội dung đề.
- Chỉ dùng Client Components tại phần cần state tương tác như làm bài, đồng hồ và lịch sử local.
- CSS có thể dùng Tailwind được tạo cùng Next.js hoặc CSS Modules. Chỉ chọn một cách và áp dụng nhất quán.

Không thêm state-management library trong MVP. State của phiên làm bài đủ nhỏ để quản lý bằng React state/reducer.

### 5.2 Cấu trúc thư mục dự kiến

```text
.
├── AGENTS.md
├── PLAN.md
├── de-cuong/
├── de-mau/
│   ├── anh-van/
│   └── iq/
├── public/
├── bin/
│   └── markq.mjs
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── quiz/[subject]/[slug]/page.tsx
│   ├── components/
│   │   └── quiz/
│   ├── lib/
│   │   └── quiz/
│   │       ├── discover.ts
│   │       ├── parse-questions.ts
│   │       ├── parse-answers.ts
│   │       ├── validate.ts
│   │       ├── score.ts
│   │       └── types.ts
│   └── test-fixtures/
├── tests/
│   └── cli/
├── markq.config.json
├── package.json
└── README.md
```

Đây là định hướng, không phải yêu cầu tạo abstraction trước khi cần. Chỉ tách file khi trách nhiệm của nó đã rõ ràng.

### 5.3 Mô hình phân phối

MarkQ được phát hành theo hai kênh từ cùng một repository:

1. **GitHub:** source code, issue tracker, contribution workflow và release notes.
2. **npm:** package CLI tên `markq` để người dùng chạy bằng `npx` hoặc cài global nếu muốn.

Repository vẫn là một ứng dụng Next.js, không tách `packages/core`, `packages/cli` hoặc `apps/web`. CLI chỉ là lớp khởi động mỏng bao quanh parser và bản Next.js đã build.

Luồng người dùng cuối dự kiến:

```bash
mkdir my-quizzes
cd my-quizzes
npx markq init

# Thêm hoặc sửa các file trong quizzes/
npx markq validate
npx markq serve
```

Sau đó người dùng mở URL local do CLI in ra, mặc định là `http://localhost:3000`.

Thư mục của người dùng không chứa source Next.js:

```text
my-quizzes/
├── markq.config.json
└── quizzes/
    └── example/
        ├── de-so-01-cau-hoi.md
        └── de-so-01-dap-an-va-goi-y.md
```

`markq.config.json` tối thiểu:

```json
{
  "contentDir": "./quizzes",
  "siteTitle": "My Quizzes"
}
```

Trong repository ôn thi hiện tại, config dùng `./de-mau` làm `contentDir` để không cần di chuyển dữ liệu.

### 5.4 Contract của CLI

MVP chỉ có các command sau:

```text
markq init [directory]
markq validate [directory]
markq serve [directory] [--port <number>]
markq --help
markq --version
```

#### `markq init`

- Tạo `markq.config.json` và một cặp file quiz mẫu nhỏ.
- Mặc định dùng thư mục hiện tại; nhận thư mục đích tùy chọn.
- Không ghi đè file đã tồn tại.
- In ra các bước tiếp theo sau khi hoàn thành.

#### `markq validate`

- Đọc config và parse toàn bộ cặp file Markdown.
- In số đề và số câu hợp lệ.
- Trả exit code `0` khi hợp lệ, khác `0` khi có lỗi.
- Lỗi phải bao gồm đường dẫn file và số câu nếu xác định được.

#### `markq serve`

- Chạy validation trước khi khởi động web.
- Resolve `contentDir` thành đường dẫn tuyệt đối từ thư mục người dùng.
- Khởi động Next.js standalone server được đóng gói cùng CLI.
- Mặc định dùng port `3000`; cho phép đổi bằng `--port`.
- Dữ liệu nội dung vẫn nằm ở máy người dùng và không được upload ra ngoài.

Không thêm command `build`, `deploy`, `login`, `publish` hoặc `generate` trong MVP. Chúng chỉ được xem xét khi ba command trên đã ổn định.

### 5.5 Nội dung npm package

Trường `files` trong `package.json` chỉ đưa những artifact cần thiết vào package:

```text
bin/
dist/cli/
dist/server/
dist/static/
templates/
README.md
LICENSE
```

Release workflow phải:

1. Chạy unit tests, lint và production build.
2. Build Next.js với `output: "standalone"`.
3. Gom standalone server, `.next/static` và `public` vào artifact phát hành.
4. Chạy `npm pack --dry-run` để kiểm tra danh sách file.
5. Cài file `.tgz` vào một thư mục tạm sạch.
6. Chạy `markq init`, `markq validate` và smoke test `markq serve` từ package vừa cài.

Không coi việc CLI chạy được bên trong repository là bằng chứng package npm hoạt động. Bản `.tgz` phải được test độc lập trước khi release.

## 6. Nguồn dữ liệu và quy ước file

### 6.1 Khám phá đề

MVP quét các thư mục môn trực tiếp bên trong `contentDir` và ghép file theo tên. Trong workspace hiện tại, `contentDir` là `de-mau/`:

```text
<slug>-cau-hoi.md
<slug>-dap-an-va-goi-y.md
```

Ví dụ:

```text
de-mau/iq/de-so-01-cau-hoi.md
de-mau/iq/de-so-01-dap-an-va-goi-y.md
```

Trong ví dụ này:

- `subject`: `iq`
- `slug`: `de-so-01`

Các thư mục như `de-mau/skills/` không phải dữ liệu đề và phải được bỏ qua.

### 6.2 Cú pháp câu hỏi hiện tại

Một câu hỏi có dạng:

```md
### Câu 1

Số tiếp theo của dãy `19, 28, 37, 46, ...` là số nào?

- A. 54
- B. 64
- C. 55
- D. 56
```

Parser phải:

- Nhận diện số câu từ heading `### Câu N`.
- Giữ lại nội dung Markdown của câu hỏi.
- Nhận diện lựa chọn từ dòng `- A.`, `- B.`, `- C.`, `- D.`.
- Không phụ thuộc vào việc đáp án đúng luôn nằm ở cùng một vị trí.
- Báo lỗi rõ tên file và số câu nếu câu bị thiếu nội dung, trùng nhãn hoặc không có lựa chọn.

MVP chỉ yêu cầu câu hỏi một đáp án đúng. Hỗ trợ nhiều đáp án, điền khuyết hoặc tự luận là phần mở rộng sau MVP.

### 6.3 Cú pháp đáp án hiện tại

Đáp án nhanh được lấy từ bảng Markdown trong mục `## Đáp án nhanh`:

```md
| Câu | Đáp án | Câu | Đáp án |
|---:|:---:|---:|:---:|
| 1 | C | 2 | A |
```

Gợi ý và lời giải được lấy từ các mục:

```md
### Câu 1 — C

- **Gợi ý:** Xét hiệu giữa hai số liên tiếp.
- **Lời giải:** Mỗi số tăng 9.
- **Mục đề cương:** 1 — Dãy số tăng dần, cấp số cộng.
```

Parser phải ghép dữ liệu theo **số câu**, không dựa vào thứ tự xuất hiện trong bảng.

### 6.4 Validation bắt buộc

Một đề chỉ được đưa vào catalog khi:

- Có đủ cả file câu hỏi và file đáp án.
- Số câu không trùng và tạo thành tập hợp nhất quán.
- Mỗi câu có đúng một đáp án hợp lệ.
- Nhãn đáp án đúng tồn tại trong danh sách lựa chọn của câu đó.
- Không có đáp án thừa hoặc câu hỏi thiếu đáp án.

Trong development, lỗi phải làm quá trình load đề thất bại với thông báo có thể sửa được. Không âm thầm bỏ qua dữ liệu sai.

Quy định tối thiểu 50 câu thuộc quy trình tạo đề của workspace, không phải ràng buộc cứng của engine MarkQ. Engine vẫn phải đọc được quiz nhỏ để test và để cộng đồng sử dụng.

## 7. Mô hình dữ liệu nội bộ

Mô hình tối thiểu:

```ts
type ChoiceLabel = "A" | "B" | "C" | "D";

type QuizChoice = {
  label: ChoiceLabel;
  content: string;
};

type QuizQuestion = {
  number: number;
  prompt: string;
  choices: QuizChoice[];
  correctChoice: ChoiceLabel;
  hint?: string;
  explanation?: string;
  syllabusReference?: string;
};

type Quiz = {
  id: string;
  slug: string;
  subject: string;
  title: string;
  suggestedDurationMinutes?: number;
  questions: QuizQuestion[];
};
```

UI không được phụ thuộc trực tiếp vào AST của Markdown. Parser chịu trách nhiệm chuyển Markdown thành model ổn định ở trên.

## 8. Luồng giao diện

### 8.1 Trang danh sách đề `/`

Hiển thị:

- Tên MarkQ và mô tả ngắn.
- Bộ lọc môn Anh văn/IQ nếu cả hai có dữ liệu.
- Danh sách đề với tiêu đề, số câu và thời gian gợi ý.
- Trạng thái kết quả gần nhất nếu đã từng làm trên trình duyệt hiện tại.
- Nút bắt đầu hoặc làm lại.

### 8.2 Trang làm bài `/quiz/[subject]/[slug]`

Gồm ba trạng thái chính:

1. **Intro:** thông tin đề và nút bắt đầu.
2. **Attempt:** câu hỏi, lựa chọn, điều hướng, tiến độ và đồng hồ.
3. **Result:** điểm số, thống kê và review lời giải.

Không cần route riêng cho kết quả trong MVP. Kết quả là state của cùng trang và được lưu vào `localStorage` sau khi nộp.

### 8.3 Quy tắc chấm điểm

- Mỗi câu đúng được 1 điểm.
- Câu sai hoặc bỏ trống được 0 điểm.
- Phần trăm bằng `correct / total * 100`, làm tròn đến số nguyên gần nhất để hiển thị.
- Kết quả phải phân biệt `correct`, `incorrect` và `unanswered`.
- Không hiển thị đáp án đúng trước khi người dùng nộp bài.

### 8.4 Lưu dữ liệu local

Sử dụng `localStorage` với key có version, ví dụ:

```text
markq:attempts:v1
```

Mỗi lịch sử làm bài chỉ cần:

- Quiz ID.
- Thời điểm bắt đầu và nộp bài.
- Thời gian đã dùng.
- Tổng số câu, số đúng, số sai, số bỏ trống và phần trăm.
- Các lựa chọn của người dùng để có thể xem lại.

Giới hạn một số lần gần nhất cho mỗi đề để tránh dữ liệu tăng vô hạn. Con số cụ thể được chọn khi triển khai và phải có test.

## 9. Parser và rendering Markdown

- Việc đọc file dùng Node `fs` trong server-only code; không đọc filesystem từ Client Component.
- Parser dữ liệu đề là code nội bộ và bám theo grammar được mô tả trong tài liệu này.
- Nội dung câu hỏi, lựa chọn và lời giải có thể chứa inline Markdown như code, in đậm và công thức dạng text.
- Nếu cần render Markdown đầy đủ, chỉ thêm thư viện nhỏ, phổ biến như `react-markdown` và `remark-gfm`; không xây CMS hoặc pipeline MDX trong MVP.
- Không cho phép raw HTML từ file Markdown chạy trực tiếp trong trình duyệt.

## 10. Trạng thái và hành vi phiên làm bài

State tối thiểu của một attempt:

```ts
type AttemptState = {
  status: "idle" | "in-progress" | "submitted";
  currentQuestionIndex: number;
  answers: Record<number, ChoiceLabel>;
  startedAt: number | null;
  submittedAt: number | null;
};
```

Các hành vi cần hỗ trợ:

- `startAttempt`
- `selectAnswer`
- `goToQuestion`
- `submitAttempt`
- `restartAttempt`
- `retryIncorrect`

Không cần generic event framework. Một reducer hoặc một nhóm hàm thuần là đủ.

## 11. Kiểm thử và tiêu chí xác minh

### 11.1 Unit tests

Tối thiểu phải có test cho:

- Ghép đúng cặp file đề.
- Parse đủ câu hỏi và các lựa chọn từ fixture Markdown.
- Parse bảng đáp án có nhiều cặp cột trên một hàng.
- Ghép đúng gợi ý/lời giải theo số câu.
- Từ chối câu trùng số, thiếu đáp án hoặc đáp án không tồn tại.
- Chấm đúng các trường hợp đúng, sai và bỏ trống.
- Tính phần trăm và thống kê chính xác.
- Serialize/deserialize lịch sử attempt.
- Parse và validate `markq.config.json`.
- CLI trả đúng exit code cho nội dung hợp lệ và không hợp lệ.

### 11.2 Kiểm tra tích hợp tối thiểu

- Trang chủ render được đề IQ hiện có.
- Mở đề, chọn đáp án và chuyển câu không mất state.
- Nộp một attempt mẫu và thấy điểm đúng.
- Reload sau khi nộp vẫn thấy lịch sử kết quả.
- Production build hoàn thành mà không có TypeScript hoặc lint error.
- File npm `.tgz` có thể được cài trong thư mục tạm sạch.
- `markq init`, `markq validate` và `markq serve` hoạt động từ package đã cài, không phụ thuộc vào source repository.

### 11.3 Definition of Done cho mỗi thay đổi

Một task chỉ hoàn thành khi:

- Hành vi được mô tả bằng tiêu chí kiểm tra cụ thể.
- Test liên quan đã chạy và pass.
- Không sửa nội dung đề thi ngoài phạm vi task.
- Không thêm abstraction hoặc dependency không được dùng.
- `README.md` được cập nhật nếu lệnh chạy hoặc định dạng input thay đổi.

## 12. Các giai đoạn triển khai

### Giai đoạn 1 — Khởi tạo và parser

- Khởi tạo Next.js + TypeScript ngay tại root.
- Giữ nguyên `de-cuong/` và `de-mau/`.
- Định nghĩa types, discovery, parser và validation.
- Viết unit tests bằng fixture nhỏ và kiểm tra với đề IQ thật.

Kết quả mong đợi: code có thể trả về một `Quiz` hợp lệ từ cặp file Markdown hiện có.

### Giai đoạn 2 — Trải nghiệm làm bài

- Trang catalog.
- Trang intro và attempt.
- Điều hướng câu hỏi, progress, đồng hồ và xác nhận nộp.
- Scoring và result summary.

Kết quả mong đợi: có thể hoàn thành một đề từ đầu đến cuối trên desktop và mobile.

### Giai đoạn 3 — Review và lịch sử

- Review đáp án, gợi ý và lời giải.
- Bộ lọc câu sai/bỏ trống.
- Retry incorrect.
- Lưu và hiển thị lịch sử local.

Kết quả mong đợi: reload trình duyệt không làm mất các kết quả đã nộp.

### Giai đoạn 4 — CLI và phát hành open source

- Viết README cài đặt, định dạng Markdown và ví dụ tối thiểu.
- Thêm `markq init`, `markq validate` và `markq serve`.
- Build và đóng gói Next.js standalone server cùng CLI.
- Thêm LICENSE phù hợp, mặc định đề xuất MIT.
- Thêm CONTRIBUTING.md sau khi workflow đóng góp đã rõ.
- Thêm CI chạy test, lint và build.
- Test package bằng file `.tgz` trong thư mục tạm trước khi publish.

Kết quả mong đợi: người khác có thể chạy MarkQ bằng `npx` với thư mục Markdown của riêng họ mà không cần clone hoặc hiểu source Next.js.

## 13. Nguyên tắc dành cho agent triển khai

1. Đọc `AGENTS.md` và các file đề cương liên quan trước khi tạo hoặc sửa nội dung ôn tập.
2. Không tự thêm môn Tin học.
3. Không thay đổi format Markdown nguồn chỉ để parser dễ viết; ưu tiên parser tương thích với dữ liệu đang có.
4. Giữ Next.js là một app duy nhất, không chuyển sang Turborepo.
5. Không thêm backend hoặc database để giải quyết bài toán chỉ cần `localStorage`.
6. Không refactor nội dung đề khi đang làm tính năng web.
7. Khi format đầu vào chưa rõ, thêm fixture thể hiện trường hợp đó rồi mới sửa parser.
8. Mọi lỗi dữ liệu phải chỉ ra file và câu liên quan để tác giả sửa được.
9. Ưu tiên hàm thuần cho parsing và scoring để dễ kiểm thử.
10. Giữ thay đổi nhỏ, có thể xác minh và bám sát giai đoạn hiện tại.
11. Không tách CLI thành package hoặc workspace riêng; dùng trường `bin` trong `package.json` hiện tại.
12. Luôn smoke test artifact npm đã đóng gói, không chỉ test source tree.

## 14. Các quyết định đã chốt

- Tên dự án: **MarkQ**.
- Open source và local-first.
- Một ứng dụng Next.js, không Turborepo.
- Phát hành package npm `markq` với CLI chạy bằng `npx`.
- CLI MVP gồm `init`, `validate` và `serve`.
- Người dùng cuối chỉ giữ config và Markdown; source Next.js nằm trong package MarkQ.
- Markdown là source of truth.
- Hỗ trợ format cặp file hiện tại trước khi mở rộng format khác.
- Kết quả lưu trong trình duyệt, không có tài khoản hoặc database trong MVP.
- Nội dung đề và engine ứng dụng là hai trách nhiệm riêng biệt.

## 15. Câu hỏi để dành cho sau MVP

Các câu hỏi này không được dùng làm lý do trì hoãn MVP:

- Có cần một file Markdown tự chứa cả câu hỏi và đáp án không?
- Có cần export/import theo GIFT hoặc QTI không?
- Có cần static export để mở một file HTML không?
- Có cần hỗ trợ nhiều đáp án đúng, câu số hoặc câu tự luận không?
- Có cần cấu hình theme và branding theo từng bộ đề không?
- Có cần `markq build` để xuất website tĩnh không cần Node server không?
