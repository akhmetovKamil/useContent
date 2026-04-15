import { useParams } from "react-router-dom";

export function ProjectPage() {
  const { slug, projectId } = useParams();

  return (
    <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 md:p-8">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
        Project view
      </div>
      <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
        Project {projectId}
      </h2>
      <p className="mt-3 text-[var(--muted)]">
        Reader route for author <strong>@{slug}</strong>. This page will become
        the project explorer once we wire project tree data.
      </p>
    </section>
  );
}
