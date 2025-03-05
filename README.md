# Remote  Workflow Trigger Action

This GitHub Action triggers a workflow in another repository, waits for it to complete, and reports back the status. It's useful for creating CI/CD pipelines that span multiple repositories.

## Features

- Trigger workflows in external repositories using `workflow_dispatch` events
- Wait for the triggered workflow to complete
- Report back the status, conclusion, and URL of the triggered workflow
- Pass custom inputs to the triggered workflow
- Configurable timeout and polling intervals

## Prerequisites

- A GitHub Personal Access Token (PAT) with `workflow` scope permissions on the target repository
- The target repository must have a workflow configured to accept `workflow_dispatch` events

## Usage

```yaml
jobs:
  trigger-workflow:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger workflow in another repository
        uses: oleksandr-zhyhalo/remote-workflow-trigger@v1
        id: trigger
        with:
          target_repo: 'org/repo'
          workflow_id: 'build.yml'
          github_token: ${{ secrets.CROSS_REPO_PAT }}
          ref: 'main'
          inputs: '{"param1": "value1", "param2": "value2"}'
          wait_interval: '10'
          timeout: '3600'
      
      - name: Use the outputs
        run: |
          echo "Workflow URL: ${{ steps.trigger.outputs.workflow_url }}"
          echo "Status: ${{ steps.trigger.outputs.status }}"
          echo "Conclusion: ${{ steps.trigger.outputs.conclusion }}"
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `target_repo` | Repository to trigger the workflow in (format: `owner/repo`) | Yes | |
| `workflow_id` | ID or filename of the workflow to trigger | Yes | |
| `github_token` | GitHub PAT with workflow permissions on the target repository | Yes | |
| `ref` | Git reference to run the workflow against (branch, tag, or SHA) | No | `main` |
| `inputs` | JSON string containing inputs for the workflow | No | `{}` |
| `wait_interval` | Seconds to wait between status checks | No | `10` |
| `timeout` | Maximum seconds to wait for workflow completion | No | `3600` |

## Outputs

| Output | Description |
|--------|-------------|
| `workflow_url` | URL of the triggered workflow run |
| `status` | Final status of the workflow run |
| `conclusion` | Conclusion of the workflow run (`success`, `failure`, etc.) |
| `run_id` | ID of the triggered workflow run |

## Creating a Personal Access Token (PAT)

1. Go to your GitHub account settings
2. Select "Developer settings" from the sidebar
3. Select "Personal access tokens" and then "Tokens (classic)"
4. Click "Generate new token" and select "Generate new token (classic)"
5. Give your token a descriptive name
6. Select the `workflow` scope to allow triggering workflows
7. Click "Generate token" and copy the token
8. Add the token as a secret in your repository settings (e.g., `CROSS_REPO_PAT`)

## Security Considerations

- Store your PAT as a GitHub secret, never hardcode it in your workflows
- Use the principle of least privilege: create a PAT with only the permissions needed
- Consider creating a dedicated GitHub account or machine user for cross-repository automation

## License

MIT
