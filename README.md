# tranquac.github.io

Blog cá nhân, dựng bằng [Hugo](https://gohugo.io) với theme [LoveIt](https://github.com/dillonzq/LoveIt).

GitHub Pages phục vụ **thẳng thư mục `docs/` trên nhánh `master`**. Vì vậy không sửa tay file trong `docs/`:
mọi thay đổi làm trong `content/` (hoặc `config.toml`), rồi build lại để Hugo sinh HTML vào `docs/`.

## Quy trình cập nhật nội dung

1. Sửa Markdown trong `content/`, ví dụ `content/about.md` hoặc `content/posts/*.md`.
2. Build (Hugo ghi kết quả vào `docs/` vì `publishDir = "docs"` trong `config.toml`):

   ```sh
   hugo --cleanDestinationDir
   ```

3. Kiểm tra lại: `git status` và `git diff --stat docs`.
4. Commit cả `content/` và `docs/`, rồi `git push origin master`. GitHub Pages cập nhật sau khoảng một phút.

Xem trước trên máy: `hugo server -D` rồi mở <http://localhost:1313> (`-D` hiển thị cả bài còn `draft: true`).

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
| `content/` | Nguồn Markdown: `about.md`, `posts/`, `write-up/` |
| `static/` | File copy nguyên xi vào `docs/` (`.nojekyll`, favicon, `CNAME` nếu dùng lại domain riêng) |
| `themes/LoveIt` | Theme, git submodule ghim ở commit `a0d6144` (2022-07-08) |
| `layouts/partials/plugin/share.html` | Bản override duy nhất của theme: cho phép `params.social.Twitter` là dict (`id`, `url`, `title`) để profile trỏ sang x.com mà nút share vẫn có `via @quaccws`. Đồng bộ lại nếu đổi pin theme |
| `docs/` | Output build, chính là thứ GitHub Pages phục vụ. Không sửa tay |
| `resources/_gen/` | Cache của Hugo, đã ignore trong `.gitignore` |

## Ghi chú


- `hugo --cleanDestinationDir` xoá mọi file trong `docs/` không còn được sinh ra. File tĩnh cần giữ
  (`CNAME`, favicon, ...) phải đặt trong `static/`.
- Nâng cấp theme hoặc Hugo là việc riêng: LoveIt mới hơn yêu cầu Hugo mới hơn và đổi HTML/CSS toàn site.
  Build thử ra thư mục tạm (`hugo -d /tmp/build`) và so sánh với `docs/` trước khi đổi pin.
- `hugo.exe` ở gốc repo là binary Windows từ quy trình cũ. Kiểm tra `hugo.exe version` ra `0.83.1+extended`
  trước khi dùng, nếu không output sẽ khác.
- `<head>` hiện tham chiếu `/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest`, `/logo.png`
  nhưng chưa có file nào trong repo (trả về 404). Thêm vào `static/` nếu muốn có favicon.
