# Markdown (.md) Complete Syntax Notes

## 1. Headings

**Purpose:** To define titles and subheadings. Markdown supports six heading levels.

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

- `#` — Level 1 heading.
- `##` — Level 2 heading.
- Each additional `#` represents a lower heading level.
- Add a space after the `#` symbols.

## 2. Text Formatting

### 2.1 Bold

**Purpose:** To emphasize important text.

```markdown
**text**
__text__
```

- `**text**` — Uses two asterisks around text.
- `__text__` — Uses two underscores around text.

### 2.2 Italic

**Purpose:** To emphasize text with italic formatting.

```markdown
*text*
_text_
```

- `*text*` — Uses single asterisks.
- `_text_` — Uses single underscores.

### 2.3 Bold and Italic

**Purpose:** To apply bold and italic formatting together.

```markdown
***text***
___text___
```

### 2.4 Strikethrough

**Purpose:** To indicate deleted or no-longer-valid text. Supported by GitHub Flavored Markdown.

```markdown
~~text~~
```

### 2.5 Inline Code

**Purpose:** To display a short command, variable, method, filename, or code fragment within a sentence.

```markdown
`code`
```

- Uses one backtick on each side.
- Suitable for short code snippets.

### 2.6 Highlighted Text

**Purpose:** To highlight text using HTML where supported.

```html
<mark>text</mark>
```

- `<mark>` — Starts highlighted text.
- `</mark>` — Ends the highlighted text.
- Support depends on the Markdown renderer.

---

## 3. Paragraphs and Line Breaks

### 3.1 Paragraphs

**Purpose:** To separate blocks of text.

```markdown
First paragraph.

Second paragraph.
```

- Leave a blank line between paragraphs.

### 3.2 Line Breaks

**Purpose:** To start a new line without creating a new paragraph.

```markdown
First line.  
Second line.
```

- Two trailing spaces create a hard line break in CommonMark-compatible renderers.
- Alternatively, use `<br>` where HTML is supported.

---

## 4. Lists

### 4.1 Unordered List

**Purpose:** To create bullet points.

```markdown
- Item
- Item
- Item
```

Alternative markers:

```markdown
* Item
+ Item
```

- `-`, `*`, and `+` can introduce unordered list items.
- Use consistent markers within a list for readability.

### 4.2 Ordered List

**Purpose:** To create a numbered sequence.

```markdown
1. First item
2. Second item
3. Third item
```

- A number followed by a period introduces an item.
- Use ordered lists when sequence or priority matters.

### 4.3 Nested List

**Purpose:** To create a list inside another list.

```markdown
- Parent item
  - Child item
  - Child item
- Parent item
```

- Indent child items with spaces.
- Use consistent indentation.

### 4.4 Task List

**Purpose:** To track completed and pending tasks. Supported by GitHub Flavored Markdown.

```markdown
- [ ] Pending task
- [x] Completed task
```

- `- [ ]` — Unchecked task.
- `- [x]` — Checked task.

---

## 5. Code Blocks

**Purpose:** To display multiline code separately from regular text, with optional syntax highlighting.

Use three backticks at the beginning and end of the code block.

### 5.1 Plain Text

```markdown
```text
Your text here
```
```

- `text` — Specifies plain text without programming-language syntax highlighting.

### 5.2 JavaScript

```markdown
```js
// JavaScript code
```
```

- `js` — Identifies JavaScript code.

### 5.3 TypeScript

```markdown
```ts
// TypeScript code
```
```

- `ts` — Identifies TypeScript code.

### 5.4 Java

```markdown
```java
// Java code
```
```

- `java` — Identifies Java code.

### 5.5 Bash

```markdown
```bash
# Bash commands
```
```

- `bash` — Identifies Bash shell commands.

### 5.6 Shell

```markdown
```sh
# Shell commands
```
```

- `sh` — Identifies shell scripts or commands.

### 5.7 PowerShell

```markdown
```powershell
# PowerShell commands
```
```

- `powershell` — Identifies PowerShell commands.

### 5.8 JSON

```markdown
```json
{
  "key": "value"
}
```
```

- `json` — Identifies JSON data.

### 5.9 HTML

```markdown
```html
<!-- HTML code -->
```
```

- `html` — Identifies HTML markup.

### 5.10 CSS

```markdown
```css
/* CSS code */
```
```

- `css` — Identifies CSS rules.

### 5.11 JSX and TSX

```markdown
```jsx
// React JSX code
```
```

```markdown
```tsx
// React TypeScript JSX code
```
```

- `jsx` — Identifies JSX syntax.
- `tsx` — Identifies TypeScript with JSX syntax.

### 5.12 SQL

```markdown
```sql
-- SQL query
```
```

- `sql` — Identifies SQL statements.

### 5.13 XML

```markdown
```xml
<!-- XML content -->
```
```

- `xml` — Identifies XML markup.

### 5.14 YAML

```markdown
```yaml
key: value
```
```

- `yaml` — Identifies YAML configuration.
- `yml` — An alternative language identifier used by some renderers.

### 5.15 Python

```markdown
```python
# Python code
```
```

- `python` — Identifies Python code.

### 5.16 Other Common Language Identifiers

| Identifier | Purpose |
|---|---|
| `text` | Plain text |
| `js` | JavaScript |
| `ts` | TypeScript |
| `java` | Java |
| `bash` | Bash commands |
| `sh` | Shell commands |
| `powershell` | PowerShell commands |
| `json` | JSON data |
| `html` | HTML markup |
| `css` | CSS rules |
| `jsx` | React JSX |
| `tsx` | React TypeScript JSX |
| `sql` | SQL statements |
| `xml` | XML markup |
| `yaml` | YAML configuration |
| `python` | Python code |
| `php` | PHP code |
| `c` | C code |
| `cpp` | C++ code |
| `csharp` | C# code |
| `kotlin` | Kotlin code |
| `go` | Go code |
| `rust` | Rust code |
| `markdown` | Markdown source |
| `diff` | Textual differences |

**Important:** The language identifier enables syntax highlighting when supported by the renderer. It does not execute the code.

---

## 6. Blockquotes

**Purpose:** To quote text or distinguish a note from surrounding content.

```markdown
> Quoted text
```

### Nested Blockquotes

```markdown
> First-level quote
>
> > Second-level quote
```

- `>` introduces a blockquote.
- Additional `>` symbols create nested quote levels.

---

## 7. Horizontal Rules

**Purpose:** To visually separate sections.

```markdown
---
```

Alternative syntax:

```markdown
***
```

```markdown
___
```

- Use three or more hyphens, asterisks, or underscores on a separate line.
- Keep the rule separate from surrounding content.

---

## 8. Links

### 8.1 Basic Link

**Purpose:** To link to a webpage or another resource.

```markdown
[Link text](https://example.com)
```

- `[]` — Contains the visible link text.
- `()` — Contains the destination URL.

### 8.2 Link with a Title

**Purpose:** To provide additional information about a link.

```markdown
[Link text](https://example.com "Link title")
```

- The quoted title may appear as a tooltip in supported renderers.

### 8.3 Automatic Link

**Purpose:** To make a URL recognizable as a link.

```markdown
<https://example.com>
```

### 8.4 Email Link

**Purpose:** To create a link that opens an email application.

```markdown
[Contact](mailto:example@example.com)
```

### 8.5 Reference-Style Link

**Purpose:** To separate a link's destination from where the link is used.

```markdown
[Documentation][docs]

[docs]: https://example.com
```

- `[Documentation][docs]` — References a named link.
- `[docs]: URL` — Defines the destination.

---

## 9. Images

**Purpose:** To embed an image in a Markdown document.

### 9.1 Basic Image

```markdown
![Alternative text](image.png)
```

- `!` — Indicates an image.
- `[]` — Contains alternative text.
- `()` — Contains the image URL or path.

### 9.2 Image with a Title

```markdown
![Alternative text](image.png "Image title")
```

- The title may appear as a tooltip in supported renderers.

### 9.3 Relative Image Path

```markdown
![Dashboard](./assets/dashboard.png)
```

- `./` — Refers to a path relative to the current document's directory.
- Ensure the image exists at the specified path.

---

## 10. Tables

**Purpose:** To organize related information into rows and columns. Tables are supported by GitHub Flavored Markdown.

### 10.1 Basic Table

```markdown
| Column 1 | Column 2 |
|---|---|
| Value 1 | Value 2 |
| Value 3 | Value 4 |
```

- `|` — Separates columns.
- `-` — Defines the header separator row.
- The first row contains column headings.

### 10.2 Text Alignment

```markdown
| Left | Center | Right |
|:---|:---:|---:|
| Value | Value | Value |
```

- `:---` — Left alignment.
- `:---:` — Center alignment.
- `---:` — Right alignment.

---

## 11. Escaping Special Characters

**Purpose:** To display Markdown control characters literally instead of interpreting them as formatting.

```markdown
\*text\*
\_text\_
\# Heading
\+ Item
\- Item
\![](image.png)
```

- `\` — Escape character.
- Use it before supported punctuation when the character should appear literally.

---

## 12. HTML Inside Markdown

**Purpose:** To use HTML elements when the Markdown renderer supports them.

### 12.1 Line Break

```html
<br>
```

- Inserts an HTML line break.

### 12.2 Horizontal Rule

```html
<hr>
```

- Inserts an HTML horizontal rule.

### 12.3 Highlighted Text

```html
<mark>text</mark>
```

- Marks text for highlighting.

### 12.4 Subscript and Superscript

```html
<sub>text</sub>
<sup>text</sup>
```

- `<sub>` — Subscript.
- `<sup>` — Superscript.

### 12.5 Collapsible Section

```html
<details>
  <summary>Section title</summary>

  Hidden or expandable content.
</details>
```

- `<details>` — Defines expandable content.
- `<summary>` — Defines the visible heading.
- Support depends on the renderer and its HTML policies.

---

## 13. Footnotes

**Purpose:** To add explanatory notes without interrupting the main text. Supported by GitHub Flavored Markdown.

```markdown
Main text with a footnote.[^1]

[^1]: Footnote explanation.
```

- `[^1]` — Footnote reference.
- `[^1]:` — Footnote definition.
- The identifier must match the reference and definition.

---

## 14. Mathematical Expressions

**Purpose:** To represent mathematical notation in renderers that support LaTeX-style math.

### 14.1 Inline Math

```markdown
$E = mc^2$
```

- `$...$` — Delimits an inline mathematical expression in supported renderers.

### 14.2 Block Math

```markdown
$$
E = mc^2
$$
```

- `$$...$$` — Delimits a displayed mathematical expression in supported renderers.

---

## 15. Comments

**Purpose:** To add source comments that normally are not displayed in rendered Markdown.

```html
<!-- This is a comment. -->
```

- `<!--` — Starts an HTML comment.
- `-->` — Ends the comment.
- Comments may still be visible in the raw source.

---

## 16. File Paths and Directory Structures

**Purpose:** To document project folders and files.

```markdown
```text
project/
├── frontend/
│   ├── src/
│   └── package.json
├── backend/
│   ├── src/
│   └── pom.xml
└── README.md
```
```

- `├──` — Represents a branch in the directory tree.
- `└──` — Represents the final item in a branch.
- `│` — Represents a continuing branch.
- `text` — Provides plain-text formatting for the structure.

---

## 17. Common Mistakes

1. Missing the space after heading markers.
2. Using unmatched formatting delimiters.
3. Forgetting to close a fenced code block.
4. Using incorrect indentation for nested lists.
5. Using an incorrect image path.
6. Assuming all renderers support tables, HTML, footnotes, or mathematical expressions.
7. Assuming a language identifier executes the code.
8. Forgetting to escape punctuation when it should be displayed literally.

---

## 18. Best Practices

- Use headings to organize content hierarchically.
- Use inline code for filenames, commands, methods, and configuration keys.
- Use fenced code blocks for multiline examples.
- Specify an appropriate language identifier for syntax highlighting.
- Keep lists and tables easy to maintain.
- Use meaningful alternative text for images.
- Prefer relative image paths for repository assets.
- Preview Markdown using the renderer where it will be published.

---

## 19. Official References

1. [GitHub — Basic Writing and Formatting Syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github)
2. [GitHub Flavored Markdown Specification](https://github.github.com/gfm/)
3. [CommonMark Specification](https://spec.commonmark.org/)
4. [VS Code — Markdown Language Support](https://code.visualstudio.com/docs/languages/markdown)
