# PR Size Labeler

A GitHub Action that labels pull requests by how many lines they change. XS / S / M / L / XL.

The idea: small PRs get reviewed fast. Large PRs need coffee. This makes it obvious which is which.

## Setup

Add this to `.github/workflows/pr-size.yml`:

```yaml
name: Label PR Size
on: [pull_request_target]

jobs:
  size-label:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: neocrev/pr-size-labeler@v1
```

That's it. Every PR gets a `size/xs` through `size/xl` label automatically.

## The size chart

| Label   | Lines | What it means       |
|---------|-------|---------------------|
| size/xs | 1-10  | Coffee break review |
| size/s  | 11-50 | Quick glance        |
| size/m  | 51-200| Standard review     |
| size/l  | 201-800 | Block 30 minutes  |
| size/xl | 800+  | Schedule it         |

## Tweaking it

```yaml
- uses: neocrev/pr-size-labeler@v1
  with:
    # Custom thresholds
    xs-max: 10
    s-max: 50
    m-max: 200
    l-max: 800

    # Custom label names (if your team uses different conventions)
    label-xs: "size/xs"
    label-s: "size/s"
    label-m: "size/m"
    label-l: "size/l"
    label-xl: "size/xl"

    # Skip bots
    exclude-labels: "dependabot,automated"

    # Ignore generated files
    ignore-files: "*.lock,*.md,*.svg"
```

## Why not just use codeowners or whatever?

Size labels are the simplest signal for reviewers. A PR with `size/xs` takes 30 seconds. A PR with `size/xl` needs a meeting. No math, no guessing.

## License

MIT
