# ADR List

This section records important engineering decisions in the current useContent implementation.

<table class="adr-table">
    <thead>
        <tr>
            <th>ADR</th>
            <th>Decision</th>
            <th>Why it matters</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>ADR-001</td>
            <td>Use MinIO instead of IPFS for protected files.</td>
            <td>Protected content needs revocable access and storage accounting.</td>
        </tr>
        <tr>
            <td>ADR-002</td>
            <td>Verify access in the backend.</td>
            <td>UI-only locking cannot protect APIs or downloads.</td>
        </tr>
        <tr>
            <td>ADR-003</td>
            <td>Use signed URLs for protected content delivery.</td>
            <td>Files can be downloaded efficiently without making MinIO public.</td>
        </tr>
        <tr>
            <td>ADR-004</td>
            <td>Use a shared manager contract for reader subscriptions.</td>
            <td>Authors do not need to deploy contracts for every plan.</td>
        </tr>
        <tr>
            <td>ADR-005</td>
            <td>Use a separate platform billing manager.</td>
            <td>Author-to-platform billing has different semantics from reader subscriptions.</td>
        </tr>
        <tr>
            <td>ADR-006</td>
            <td>Deploy documentation as a static VitePress site.</td>
            <td>Documentation can be updated independently from runtime containers.</td>
        </tr>
        <tr>
            <td>ADR-007</td>
            <td>Route production domains through Coolify proxy.</td>
            <td>TLS and host routing stay centralized.</td>
        </tr>
        <tr>
            <td>ADR-008</td>
            <td>Use TanStack Query as frontend server-state boundary.</td>
            <td>Pages stay decoupled from HTTP, cache and invalidation details.</td>
        </tr>
    </tbody>
</table>

ADRs are not a changelog. They capture decisions that shape the architecture and would be expensive to reverse later.
