# tranquac.github.io

Blog cá nhân, dựng bằng [Hugo](https://gohugo.io) với theme [LoveIt](https://github.com/dillonzq/LoveIt).

GitHub Pages phục vụ **thẳng thư mục `docs/` trên nhánh `master`**. Vì vậy không sửa tay file trong `docs/`:
mọi thay đổi làm trong `content/` (hoặc `config.toml`), rồi build lại để Hugo sinh HTML vào `docs/`.

## Quy trình cập nhật nội dung

1. Sửa Markdown trong `content/`, ví dụ `content/about.md` hoặc `content/posts/*.md`.
2. Build (Hugo ghi kết quả vào `docs/` vì `publishDir = "docs"` trong `config.toml`):

   ```sh
   hugo --minify --cleanDestinationDir
   ```

   `--minify` là bắt buộc: `docs/` đang được build ở dạng nén, thiếu cờ này thì gần như mọi file HTML đều đổi.

3. Kiểm tra lại: `git status` và `git diff --stat docs`.
4. Commit cả `content/` và `docs/`, rồi `git push origin master`. GitHub Pages cập nhật sau khoảng một phút.

Xem trước trên máy: `hugo server -D --noHTTPCache` rồi mở <http://localhost:1313> (`-D` hiển thị cả bài còn
`draft: true`). `--noHTTPCache` buộc trình duyệt luôn tải CSS mới; thiếu cờ này, sau khi sửa giao diện trình duyệt
có thể vẫn vẽ trang bằng CSS cũ.

Tạo bài mới: `hugo new posts/ten-bai.md`. Archetype mặc định đặt `draft: true`; đổi thành `false` khi muốn đăng.

## Cài đặt trên máy mới

Site được ghim ở **Hugo 0.83.1 extended** (bản extended cần cho SCSS của theme). Dùng đúng phiên bản này để
output không thay đổi ngoài ý muốn.

```sh
git clone --recurse-submodules https://github.com/tranquac/tranquac.github.io
# repo đã clone sẵn thì chạy: git submodule update --init
```

Linux x86_64:

```sh
curl -LO https://github.com/gohugoio/hugo/releases/download/v0.83.1/hugo_extended_0.83.1_Linux-64bit.tar.gz
echo "7dab678e7bd47de76b311c1dc51257d1ba41d95e8e1d30869f701e1628261447  hugo_extended_0.83.1_Linux-64bit.tar.gz" | sha256sum -c
tar -xzf hugo_extended_0.83.1_Linux-64bit.tar.gz hugo
install -m 0755 hugo ~/.local/bin/hugo
hugo version    # hugo v0.83.1-5AFE0A57+extended linux/amd64
```

Windows: tải `hugo_extended_0.83.1_Windows-64bit.zip` ở cùng release
(SHA-256 `2f7fa00d26c36d076573729fe7027d3cc5a63504d77d0c328b6db64fe3c9c2e9`).
File checksum gốc: <https://github.com/gohugoio/hugo/releases/download/v0.83.1/hugo_0.83.1_checksums.txt>

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `config.toml` | Toàn bộ cấu hình site và theme (`[params]`: header, footer, profile, social, ...) |
| `content/` | Nguồn Markdown: `about.md`, `posts/`, `write-up/`, và `_index.md` (nhãn phía trên danh sách bài ở trang chủ) |
| `assets/css/` | Giao diện: `_override.scss` (biến màu, font, màu code) và `_custom.scss` (toàn bộ CSS). Xem mục "Giao diện" |
| `static/` | File copy nguyên xi vào `docs/`: `.nojekyll`, `fonts/` (font tự host), `images/avatar.jpg`, favicon, `CNAME` nếu dùng lại domain riêng |
| `themes/LoveIt` | Theme, git submodule ghim ở commit `a0d6144` (2022-07-08). Không sửa trực tiếp trong này |
| `layouts/` | Các template của theme được ghi đè ở cấp project. Xem bảng "Template ghi đè" |
| `docs/` | Output build, chính là thứ GitHub Pages phục vụ. Không sửa tay |
| `resources/_gen/` | Cache của Hugo, đã ignore trong `.gitignore` |

## Giao diện

Giao diện là theme LoveIt được chỉnh lại theo kiểu tối giản: một cột hẹp, nền tối, chữ là chính.
Không sửa gì trong `themes/LoveIt`; mọi thứ nằm ở cấp project nên xoá đi là về lại theme gốc.

| Thành phần | Nằm ở đâu |
|---|---|
| Màu (thang xám "zinc"), font, màu tô code (GitHub Light/Dark) | `assets/css/_override.scss` |
| Toàn bộ quy tắc CSS, có chú thích theo từng phần | `assets/css/_custom.scss` |
| Font Outfit (chữ) và JetBrains Mono (code), giấy phép SIL OFL 1.1 | `static/fonts/` (kèm `OFL-*.txt`) |
| Mặc định nền tối, header không dính, chữ `> root@quaccws:~#` | `config.toml`: `defaultTheme`, `[params.header]` |

Chỉnh nội dung hiển thị:

- **Phần đầu trang chủ** (`[params.home.profile]` trong `config.toml`): `title` là tên lớn, `disclaimer` là dòng
  ngay dưới tên, `subtitle` là dòng thứ hai (gõ chữ tự động), `avatarURL` là ảnh.
- **Ảnh đại diện**: `static/images/avatar.jpg`, ảnh vuông (đang là 520x520). Thay file này là đổi ở cả trang chủ lẫn About.
- **Nhãn "LATEST POSTS"** trên danh sách bài: dòng `## Latest posts` trong `content/_index.md`. Xoá file là mất nhãn.
- **Phần đầu trang About** (front matter của `content/about.md`): `avatar` là ảnh cạnh tiêu đề, `subtitle` là dòng
  dưới tiêu đề (viết được Markdown trong dòng).
- **Nút liên hệ ở trang About**: dòng `{{< contact >}}` trong `content/about.md` in hàng nút ra đúng chỗ đặt nó
  (đang là dòng cuối, nên hàng nút đóng trang). Danh sách nút là `contact` trong front matter, mỗi dòng gồm `icon`, `name`
  (chữ trên nút) và `url`. `icon` nhận `github`, `linkedin`, `x`, `telegram`, `mail`; tên khác thì nút chỉ có chữ.
  Khi là thứ cuối cùng của trang, hàng nút được căn giữa cột và nằm giữa dòng chữ cuối với dòng chân trang.
  Thêm icon mới trong `layouts/partials/contact-icon.html`.
- **Nhãn mức độ CVE có màu** trong `content/about.md`: đặt một dòng `{.severity .severity-critical}`
  (hoặc `-high`, `-medium`, `-low`) ngay dưới đoạn cần tô. Đây là chỗ duy nhất trên site dùng màu.
- **Mã CVE** cứ viết thường (`CVE-2026-12345`). Trên trang About và write-up, mỗi mã tự được giữ liền một
  khối nên không bị ngắt giữa chừng khi xuống dòng (`layouts/partials/cve-nowrap.html`).
- **Dòng trên tiêu đề bài viết** (chuyên mục / ngày / số từ / thời gian đọc) lấy từ `categories` và `date` của bài.

Khối code không còn thanh tiêu đề: nút copy hiện ở góc phải khi rê chuột, và khối dài luôn hiện đầy đủ.

### Template ghi đè

Mỗi file dưới đây là bản sao template cùng tên trong `themes/LoveIt/layouts/`, chỉ sửa đúng phần ghi ở cột phải
(đầu mỗi file có chú thích). Nếu đổi pin theme thì so lại với bản gốc.

| File trong `layouts/` | Khác theme ở chỗ nào |
|---|---|
| `partials/plugin/share.html` | Cho phép `params.social.Twitter` là dict (`id`, `url`, `title`) để profile trỏ sang x.com mà nút share vẫn có `via @quaccws` |
| `posts/single.html` | Dòng meta nằm trên tiêu đề, dạng chữ thường, không icon, không tên tác giả, không hiệu ứng tiêu đề |
| `_default/summary.html` | Thẻ bài ở trang chủ: dòng meta (chuyên mục / ngày) nằm trên tiêu đề, không icon |
| `_default/single.html` | Trang thường (About, write-up): thêm phần đầu trang với `avatar` và `subtitle` tuỳ chọn, và giữ mã CVE không bị ngắt dòng |
| `taxonomy/list.html`, `taxonomy/terms.html` | Bỏ icon thư mục/thẻ ở tiêu đề và hiệu ứng tiêu đề |

Ba file riêng của project (theme không có file trùng tên): `partials/cve-nowrap.html` (gọi từ
`_default/single.html`), `shortcodes/contact.html` và `partials/contact-icon.html` (hàng nút liên hệ).

Lưu ý khi viết template: Hugo chỉ áp `baseof.html` khi file **bắt đầu** bằng `{{ define ... }}`, nên chú thích
phải đặt sau khối `define` đầu tiên, không đặt ở dòng đầu.

### Quay về giao diện cũ

Bản trước khi đổi giao diện được đánh dấu bằng tag `backup-pre-redesign-20261115`
(và nhánh `backup/pre-redesign-20261115`), cả hai đã có trên GitHub.

- Xem lại bản cũ: `git checkout backup-pre-redesign-20261115`, rồi `hugo server`.
- Bỏ giao diện mới nhưng giữ nội dung: xoá `assets/css/`, `static/fonts/`, `content/_index.md` và các file trong
  `layouts/` trừ `partials/plugin/share.html`; trả lại các dòng đã đổi trong `config.toml`
  (`git diff backup-pre-redesign-20261115 -- config.toml` liệt kê chúng); rồi build lại.
  Dòng `{{< contact >}}` trong `content/about.md` cần `layouts/shortcodes/contact.html` và
  `layouts/partials/contact-icon.html`: giữ lại hai file đó, hoặc thay dòng ấy bằng chữ thường, nếu không
  build sẽ báo lỗi.

## Ghi chú

- `hugo server` chỉ theo dõi các thư mục có sẵn lúc khởi động. Nếu vừa tạo thư mục mới (ví dụ `assets/`)
  mà trang xem trước không đổi thì tắt và chạy lại `hugo server`.
- Nếu lưu một template sai cú pháp đúng lúc `hugo server` đang nạp lại `config.toml`, server có thể trả lỗi
  cho mọi trang kể cả sau khi đã sửa. Tắt và chạy lại `hugo server`.
- Sau khi push, GitHub Pages cho trình duyệt giữ file CSS cũ tối đa 10 phút. Nếu trang trên site thật trông
  lệch so với bản xem trước thì tải lại bằng Ctrl+Shift+R.
- `--cleanDestinationDir` xoá mọi file trong `docs/` không còn được sinh ra. File tĩnh cần giữ
  (`CNAME`, favicon, ...) phải đặt trong `static/`.
- Nâng cấp theme hoặc Hugo là việc riêng: LoveIt mới hơn yêu cầu Hugo mới hơn và đổi HTML/CSS toàn site.
  Build thử ra thư mục tạm (`hugo -d /tmp/build`) và so sánh với `docs/` trước khi đổi pin.
- `hugo.exe` ở gốc repo là binary Windows từ quy trình cũ. Kiểm tra `hugo.exe version` ra `0.83.1+extended`
  trước khi dùng, nếu không output sẽ khác.
- `<head>` hiện tham chiếu `/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest`, `/logo.png`
  nhưng chưa có file nào trong repo (trả về 404). Thêm vào `static/` nếu muốn có favicon.
