import { useParams } from "react-router-dom"

import { useAuthorPostQuery } from "@/queries/posts"

export function PostPage() {
    const { slug, postId } = useParams()
    const postQuery = useAuthorPostQuery(slug ?? "", postId ?? "")

    return (
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Post view
            </div>
            {postQuery.isLoading ? (
                <p className="mt-3 text-[var(--muted)]">Загружаем пост...</p>
            ) : postQuery.isError ? (
                <p className="mt-3 text-rose-600">
                    Не удалось открыть пост автора @{slug}: {postQuery.error.message}
                </p>
            ) : postQuery.data ? (
                <>
                    <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                        {postQuery.data.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        <span>{postQuery.data.status}</span>
                        <span>{postQuery.data.policyMode}</span>
                    </div>
                    <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-[var(--foreground)]">
                        {postQuery.data.content}
                    </p>
                </>
            ) : null}
        </section>
    )
}
