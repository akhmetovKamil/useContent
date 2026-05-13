import { Eyebrow, PageSection, PageTitle } from "@/components/ui/page"

export function MeDiscoverPage() {
    return (
        <section className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl gap-6 pt-12 md:pt-20">
            <PageSection className="grid place-items-center p-8 text-center md:min-h-[420px] md:p-12">
                <div>
                    <Eyebrow>reader home</Eyebrow>
                    <PageTitle className="text-4xl md:text-6xl">Discover useContent.</PageTitle>
                    <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                        A new reader home for creator discovery is being shaped here.
                    </p>
                </div>
            </PageSection>
        </section>
    )
}
