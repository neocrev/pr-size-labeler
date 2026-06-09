const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (!context.payload.pull_request) {
      core.setFailed('Not a pull request event');
      return;
    }

    const pr = context.payload.pull_request;
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const prNumber = pr.number;

    const thresholds = {
      xs: { min: 0, max: parseInt(core.getInput('xs-max')) },
      s: { min: parseInt(core.getInput('xs-max')) + 1, max: parseInt(core.getInput('s-max')) },
      m: { min: parseInt(core.getInput('s-max')) + 1, max: parseInt(core.getInput('m-max')) },
      l: { min: parseInt(core.getInput('m-max')) + 1, max: parseInt(core.getInput('l-max')) },
      xl: { min: parseInt(core.getInput('l-max')) + 1, max: Infinity },
    };

    const labelNames = {
      xs: core.getInput('label-xs'),
      s: core.getInput('label-s'),
      m: core.getInput('label-m'),
      l: core.getInput('label-l'),
      xl: core.getInput('label-xl'),
    };

    const excludeLabels = core.getInput('exclude-labels')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    // Check excluded labels (e.g. dependabot)
    const prLabels = pr.labels.map(l => l.name.toLowerCase());
    const shouldSkip = excludeLabels.some(pattern => {
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return prLabels.some(l => l.startsWith(prefix));
      }
      return prLabels.some(l => l === pattern);
    });

    if (shouldSkip) {
      core.info(`Skipping — PR matches excluded label pattern`);
      return;
    }

    // Get PR diff stats
    const { data: prData } = await octokit.rest.pulls.get({
      owner, repo, pull_number: prNumber,
    });

    let totalChanges = prData.additions + prData.deletions;

    // Filter ignored files
    const ignoreFiles = core.getInput('ignore-files')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (ignoreFiles.length > 0) {
      const { data: files } = await octokit.rest.pulls.listFiles({
        owner, repo, pull_number: prNumber,
      });

      const filtered = files.filter(f =>
        !ignoreFiles.some(pattern => {
          if (pattern.startsWith('*.')) {
            return f.filename.endsWith(pattern.slice(1));
          }
          return f.filename.includes(pattern);
        })
      );

      totalChanges = filtered.reduce((sum, f) => sum + f.additions + f.deletions, 0);
    }

    // Determine size
    let sizeKey;
    for (const [key, t] of Object.entries(thresholds)) {
      if (totalChanges >= t.min && totalChanges <= t.max) {
        sizeKey = key;
        break;
      }
    }

    const targetLabel = labelNames[sizeKey];

    // Get all existing size labels
    const sizeLabels = Object.values(labelNames);
    const existingLabels = pr.labels.map(l => l.name);
    const toRemove = existingLabels.filter(l => sizeLabels.includes(l) && l !== targetLabel);

    // Remove old size labels
    for (const label of toRemove) {
      await octokit.rest.issues.removeLabel({
        owner, repo, issue_number: prNumber, name: label,
      }).catch(() => {}); // ignore if label doesn't exist
    }

    // Add new label
    await octokit.rest.issues.addLabels({
      owner, repo, issue_number: prNumber, labels: [targetLabel],
    });

    core.info(`Labeled PR #${prNumber} as ${targetLabel} (${totalChanges} lines)`);

    core.setOutput('label', targetLabel);
    core.setOutput('lines-changed', totalChanges.toString());
    core.setOutput('size', sizeKey.toUpperCase());

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
