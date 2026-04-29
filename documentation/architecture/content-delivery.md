# Content Delivery

MongoDB stores metadata. MinIO stores binary objects. The backend links both layers through object keys and signed URLs.

## Signed URL flow

```mermaid
sequenceDiagram
    actor Reader
    participant UI as Frontend
    participant API as Backend API
    participant Access as Access service
    participant DB as MongoDB
    participant Storage as MinIO

    Reader->>UI: Click download or preview
    UI->>API: Request file URL
    API->>DB: Load post/project metadata
    API->>Access: Evaluate attached policy
    alt Allowed
        API->>Storage: Generate signed GET URL
        API-->>UI: Return temporary URL
        UI->>Storage: Download object directly
    else Denied
        API-->>UI: Return access error or locked state
    end
```

## Storage key layout

```mermaid
flowchart TD
    Root["authors/{authorId}"]
    Posts["posts/{postId}/attachments/{attachmentId}/{fileName}"]
    Projects["projects/{projectId}/nodes/{nodeId}/{fileName}"]
    Root --> Posts
    Root --> Projects
```

This layout keeps objects scoped by author and content type. It also makes storage accounting possible because post attachments and project file nodes are tracked with byte sizes in MongoDB.

## Storage accounting

```mermaid
flowchart LR
    PostAttachments["Post attachments<br/>size metadata"] --> Usage["Author storage usage"]
    ProjectFiles["Project file nodes<br/>size metadata"] --> Usage
    Usage --> Quota["Platform billing quota"]
    Quota --> UploadGuard["Upload allowed or rejected"]
```

The backend does not scan MinIO on every request to calculate usage. Instead, file size metadata is stored with post attachments and project nodes. This keeps quota checks fast and makes cleanup rules predictable.
