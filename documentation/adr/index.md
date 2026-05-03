# ADR List

This section records important engineering decisions in the current useContent implementation.

| ADR | Decision | Why it matters |
| --- | --- | --- |
| ADR-001 | Use MinIO instead of IPFS for protected files. | Protected content needs revocable access and storage accounting. |
| ADR-002 | Verify access in the backend. | UI-only locking cannot protect APIs or downloads. |
| ADR-003 | Use signed URLs for protected content delivery. | Files can be downloaded efficiently without making MinIO public. |
| ADR-004 | Use a shared manager contract for reader subscriptions. | Authors do not need to deploy contracts for every plan. |
| ADR-005 | Use a separate platform billing manager. | Author-to-platform billing has different semantics from reader subscriptions. |
| ADR-006 | Deploy documentation as a static VitePress site. | Documentation can be updated independently from runtime containers. |
| ADR-007 | Route production domains through Coolify proxy. | TLS and host routing stay centralized. |
| ADR-008 | Use TanStack Query as frontend server-state boundary. | Pages stay decoupled from HTTP, cache and invalidation details. |

ADRs are not a changelog. They capture decisions that shape the architecture and would be expensive to reverse later.
