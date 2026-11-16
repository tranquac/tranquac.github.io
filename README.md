# tranquac.github.io

Personal blog, built with [Hugo](https://gohugo.io) and the [LoveIt](https://github.com/dillonzq/LoveIt) theme.

GitHub Pages serves the **`docs/` directory on the `master` branch directly**. So don't hand-edit files in `docs/`:
make every change in `content/` (or `config.toml`), then rebuild so Hugo regenerates the HTML into `docs/`.

## Content update workflow

1. Edit the Markdown in `content/`, e.g. `content/about.md` or `content/posts/*.md`.
2. Build (Hugo writes the result into `docs/` because `publishDir = "docs"` in `config.toml`):

   ```sh
   hugo --minify --cleanDestinationDir
   ```

   `--minify` is required: `docs/` is built minified, and without this flag almost every HTML file changes.

3. Check: `git status` and `git diff --stat docs`.
4. Commit both `content/` and `docs/`, then `git push origin master`. GitHub Pages updates after about a minute.

Local preview: `hugo server -D --noHTTPCache`, then open <http://localhost:1313> (`-D` also shows posts still marked
`draft: true`). `--noHTTPCache` forces the browser to always fetch the latest CSS; without it, after a design change the
browser may still render the page with the old CSS.

Create a new post: `hugo new posts/post-name.md`. The default archetype sets `draft: true`; change it to `false` to publish.

## Setup on a new machine

The site is pinned to **Hugo 0.83.1 extended** (the extended build is needed for the theme's SCSS). Use this exact
version so the output doesn't change unexpectedly.

```sh
git clone --recurse-submodules https://github.com/tranquac/tranquac.github.io
# if the repo is already cloned, run: git submodule update --init
```

Linux x86_64:

```sh
curl -LO https://github.com/gohugoio/hugo/releases/download/v0.83.1/hugo_extended_0.83.1_Linux-64bit.tar.gz
echo "7dab678e7bd47de76b311c1dc51257d1ba41d95e8e1d30869f701e1628261447  hugo_extended_0.83.1_Linux-64bit.tar.gz" | sha256sum -c
tar -xzf hugo_extended_0.83.1_Linux-64bit.tar.gz hugo
install -m 0755 hugo ~/.local/bin/hugo
hugo version    # hugo v0.83.1-5AFE0A57+extended linux/amd64
```

Windows: download `hugo_extended_0.83.1_Windows-64bit.zip` from the same release
(SHA-256 `2f7fa00d26c36d076573729fe7027d3cc5a63504d77d0c328b6db64fe3c9c2e9`).
Original checksum file: <https://github.com/gohugoio/hugo/releases/download/v0.83.1/hugo_0.83.1_checksums.txt>

## Structure

| Path | Role |
|---|---|
| `config.toml` | All site and theme configuration (`[params]`: header, footer, profile, social, ...) |
| `content/` | Markdown sources: `about.md`, `posts/`, `write-up/`, and `_index.md` (the label above the post list on the home page) |
| `assets/css/` | Styling: `_override.scss` (colour variables, fonts, code colours) and `_custom.scss` (all the CSS). See the "Styling" section |
| `static/` | Files copied verbatim into `docs/`: `.nojekyll`, `fonts/` (self-hosted fonts), `images/avatar.jpg`, favicon, `CNAME` if reusing a custom domain |
| `themes/LoveIt` | Theme, a git submodule pinned at commit `a0d6144` (2022-07-08). Don't edit directly in here |
| `layouts/` | Theme templates overridden at the project level. See the "Template overrides" table |
| `docs/` | Build output, exactly what GitHub Pages serves. Don't hand-edit |
| `resources/_gen/` | Hugo's cache, already ignored in `.gitignore` |

## Styling

The look is the LoveIt theme reworked into a minimal style: one narrow column, dark background, text-first.
Nothing in `themes/LoveIt` is edited; everything lives at the project level, so deleting it reverts to the stock theme.

| Component | Where it lives |
|---|---|
| Colours (the "zinc" grey scale), fonts, code highlight colours (GitHub Light/Dark) | `assets/css/_override.scss` |
| All the CSS rules, commented section by section | `assets/css/_custom.scss` |
| Outfit (body) and JetBrains Mono (code) fonts, SIL OFL 1.1 license | `static/fonts/` (with `OFL-*.txt`) |
| Dark background by default, non-sticky header, the `> root@quaccws:~#` text | `config.toml`: `defaultTheme`, `[params.header]` |

Editing the displayed content:

- **Home page header** (`[params.home.profile]` in `config.toml`): `title` is the large name, `disclaimer` is the line
  right under the name, `subtitle` is the second line (typed out automatically), `avatarURL` is the image.
- **Avatar**: `static/images/avatar.jpg`, a square image (currently 520x520). Replacing this file changes it on both the home page and About.
- **The "LATEST POSTS" label** above the post list: the `## Latest posts` line in `content/_index.md`. Delete the file and the label is gone.
- **About page header** (front matter of `content/about.md`): `avatar` is the image next to the title, `subtitle` is the line
  under the title (inline Markdown allowed).
- **Contact buttons on the About page**: the `{{< contact >}}` line in `content/about.md` prints the button row exactly where
  it's placed (currently the last line, so the row closes the page). The button list is `contact` in the front matter, each entry has `icon`, `name`
  (the button text) and `url`. `icon` accepts `github`, `linkedin`, `x`, `telegram`, `mail`; any other name gives a text-only button.
  When it's the last thing on the page, the row is centred in the column and sits halfway between the last line of text and the footer.
  Add a new icon in `layouts/partials/contact-icon.html`.
- **Timeline** inside a post: the `{{< timeline >}}` ... `{{< /timeline >}}` shortcode pair, with each entry as
  `{{< event date="2026-11" >}}Description{{< /event >}}` (`date` is the mono label on the left, the inner text is the content and allows
  Markdown). Renders a vertical line with dots, good for CVE/disclosure posts. CSS is in `assets/css/_custom.scss` (search "Timeline").
- **Coloured CVE severity labels** in `content/about.md`: put a `{.severity .severity-critical}` line
  (or `-high`, `-medium`, `-low`) right under the paragraph to colour. This is the only place on the site that uses colour.
- **CVE ids** are written plainly (`CVE-2026-12345`). On the About page, write-ups and Posts, each id is kept as a single
  block so it never breaks mid-id when wrapping (`layouts/partials/cve-nowrap.html`).
- **The line above a post title** (category / date / word count / reading time) comes from the post's `categories` and `date`.

Code blocks no longer have a title bar: the copy button appears at the top right on hover, and long blocks are always shown in full.

### Template overrides

Each file below is a copy of the same-named template in `themes/LoveIt/layouts/`, changed only where noted in the right column
(each file has a comment at the top). If you change the theme pin, diff them against the originals.

| File in `layouts/` | How it differs from the theme |
|---|---|
| `partials/plugin/share.html` | Lets `params.social.Twitter` be a dict (`id`, `url`, `title`) so the profile points to x.com while the share button still has `via @quaccws` |
| `posts/single.html` | The meta line sits above the title, plain text, no icons, no author name, no title animation; keeps CVE ids from wrapping mid-id |
| `_default/summary.html` | Home-page post card: the meta line (category / date) sits above the title, no icons |
| `_default/single.html` | Plain pages (About, write-ups): adds a page header with optional `avatar` and `subtitle`, and keeps CVE ids from wrapping mid-id |
| `taxonomy/list.html`, `taxonomy/terms.html` | Drop the category/tag icon on the title and the title animation |

Project-only files (the theme has no same-named file): `partials/cve-nowrap.html` (called from
`_default/single.html` and `posts/single.html`), `shortcodes/contact.html` and `partials/contact-icon.html`
(the contact button row), `shortcodes/timeline.html` and `shortcodes/event.html` (the timeline).

A note on writing templates: Hugo only applies `baseof.html` when the file **starts** with `{{ define ... }}`, so a comment
must go after the first `define` block, not on the first line.

### Reverting to the old look

The version before the redesign is marked with the tag `backup-pre-redesign-20261115`
(and the branch `backup/pre-redesign-20261115`), both already on GitHub.

- Review the old version: `git checkout backup-pre-redesign-20261115`, then `hugo server`.
- Drop the new look but keep the content: delete `assets/css/`, `static/fonts/`, `content/_index.md` and the files in
  `layouts/` except `partials/plugin/share.html`; restore the changed lines in `config.toml`
  (`git diff backup-pre-redesign-20261115 -- config.toml` lists them); then rebuild.
  The `{{< contact >}}` line in `content/about.md` needs `layouts/shortcodes/contact.html` and
  `layouts/partials/contact-icon.html`: keep those two files, or replace that line with plain text, otherwise
  the build errors out.

## Notes

- `hugo server` only watches directories that exist at startup. If you just created a new directory (e.g. `assets/`)
  and the preview doesn't change, stop and restart `hugo server`.
- If you save a template with a syntax error right as `hugo server` is reloading `config.toml`, the server may return an error
  for every page even after you fix it. Stop and restart `hugo server`.
- After a push, GitHub Pages lets the browser keep the old CSS for up to 10 minutes. If the live site looks off
  compared to the preview, reload with Ctrl+Shift+R.
- `--cleanDestinationDir` removes any file in `docs/` that is no longer generated. Static files you need to keep
  (`CNAME`, favicon, ...) must go in `static/`.
- Upgrading the theme or Hugo is a separate job: a newer LoveIt needs a newer Hugo and changes the HTML/CSS site-wide.
  Build into a temp directory (`hugo -d /tmp/build`) and compare with `docs/` before changing the pin.
- `hugo.exe` at the repo root is a Windows binary from the old workflow. Check that `hugo.exe version` prints
  `0.83.1+extended` before using it, otherwise the output will differ.
- `<head>` currently references `/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest`, `/logo.png`
  but none of those files exist in the repo yet (they return 404). Add them to `static/` if you want a favicon.
