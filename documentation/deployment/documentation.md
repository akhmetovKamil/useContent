# Documentation Deployment

The documentation portal is a VitePress static site located in `documentation/` and published at `https://docs.usecontent.app`.

## Coolify Static App settings

<div class="doc-grid compact">
    <div class="doc-copy-card">
        <p><strong>Base Directory</strong><br><code>/documentation</code></p>
    </div>
    <div class="doc-copy-card">
        <p><strong>Install Command</strong><br><code>npm ci</code></p>
    </div>
    <div class="doc-copy-card">
        <p><strong>Build Command</strong><br><code>npm run docs:build</code></p>
    </div>
    <div class="doc-copy-card">
        <p><strong>Publish Directory</strong><br><code>dist</code></p>
    </div>
</div>

| Setting | Value |
| --- | --- |
| Domain | `docs.usecontent.app` |
| Base Directory | `/documentation` |
| Publish Directory | `/dist` |
| Auto Deploy | Triggered by the documentation Coolify webhook from GitHub Actions |

## Why no Dockerfile is required

VitePress produces static files after build. Coolify can serve those files directly as a static application, so a separate nginx container would add complexity without improving the deployment model.

The repository workflow triggers a separate Coolify webhook for the documentation resource after a push to `master`. Coolify then checks out the repository, runs the VitePress build from the `documentation` directory and publishes the static output.

The main application is served from `usecontent.app`, while documentation is served independently from `docs.usecontent.app`.

## Deployment checklist

1. Create a new Coolify Static App from the same GitHub repository.
2. Select the branch that should publish documentation.
3. Set the root directory to `documentation`.
4. Use `npm ci` as the install command.
5. Use `npm run docs:build` as the build command.
6. Use `dist` as the publish directory.
7. Set the public domain to `https://docs.usecontent.app`.
8. Trigger the resource from GitHub Actions through `COOLIFY_DOCS_WEBHOOK_URL`.

No additional environment variables are required for this documentation site.
