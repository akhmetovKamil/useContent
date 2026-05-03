# Documentation Deployment

The documentation portal is a VitePress static site located in `documentation/`.

## Coolify Static App settings

<div class="doc-copy-card">
<p><strong>Root Directory</strong><br><code>documentation</code></p>
</div>

<div class="doc-copy-card">
<p><strong>Install Command</strong><br><code>npm ci</code></p>
</div>

<div class="doc-copy-card">
<p><strong>Build Command</strong><br><code>npm run docs:build</code></p>
</div>

<div class="doc-copy-card">
<p><strong>Publish Directory</strong><br><code>.vitepress/dist</code></p>
</div>

| Setting | Value |
| --- | --- |
| Domain | `docs.domain.com` later |
| Auto Deploy | Enabled for the selected GitHub branch |

## Why no Dockerfile is required

VitePress produces static files after build. Coolify can serve those files directly as a static application, so a separate nginx container would add complexity without improving the deployment model.

When the Coolify app is connected to the GitHub repository and auto deploy is enabled, a push to the selected branch triggers a new documentation build automatically.

The main application can remain on `app.domain.com`, while documentation is served independently from `docs.domain.com`.

## Deployment checklist

1. Create a new Coolify Static App from the same GitHub repository.
2. Select the branch that should publish documentation.
3. Set the root directory to `documentation`.
4. Use `npm ci` as the install command.
5. Use `npm run docs:build` as the build command.
6. Use `.vitepress/dist` as the publish directory.
7. Enable automatic deploys for the selected branch.
8. Add `docs.domain.com` when the domain is ready.

No additional environment variables are required for this documentation site.
