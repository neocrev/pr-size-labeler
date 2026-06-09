# PR Size Labeler

**Automatically label pull requests by size — XS / S / M / L / XL.**

A GitHub Action that computes the actual lines changed (additions + deletions) and adds a `size/*` label, so reviewers can instantly tell which PRs are quick to review.

## Why?

- Small PRs (XS/S) get reviewed faster — label them so reviewers see them first
- Large PRs (XL) signal "block time" — reviewers know what they're in for
- Helps teams follow the "small PR" best practice by making size visible

## Usage

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

## Configuration

```yaml
- uses: neocrev/pr-size-labeler@v1
  with:
    # Custom thresholds (optional)
    xs-max: 10        # 0-10 lines
    s-max: 50         # 11-50 lines
    m-max: 200        # 51-200 lines
    l-max: 800        # 201-800 lines
    # >800 = XL

    # Custom labels (optional)
    label-xs: "size/xs"
    label-s: "size/s"
    label-m: "size/m"
    label-l: "size/l"
    label-xl: "size/xl"

    # Skip PRs from bots (optional)
    exclude-labels: "dependabot,automated"

    # Ignore certain files from count (optional)
    ignore-files: "*.lock,*.md,*.svg"
```

## Label scheme

| Label   | Lines changed | Review time      |
|---------|---------------|------------------|
| size/xs | 1-10          | Coffee break     |
| size/s  | 11-50         | Quick review     |
| size/m  | 51-200        | Standard review  |
| size/l  | 201-800       | Block 30 min     |
| size/xl | 800+          | Schedule it      |

## Permissions

The Action needs `pull-requests: write` to add/remove labels. If using `pull_request_target`, permissions are automatically elevated.

```yaml
permissions:
  pull-requests: write
  contents: read
```

## License

MIT
