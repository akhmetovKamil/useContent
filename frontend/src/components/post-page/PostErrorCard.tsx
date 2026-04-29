import { Card, CardContent } from "@/components/ui/card"

export function PostErrorCard({ message, slug }: { message: string; slug: string }) {
    return (
        <Card className="rounded-[32px] border-rose-200">
            <CardContent className="p-6 text-sm text-rose-600">
                Failed to open @{slug}'s post: {message}
            </CardContent>
        </Card>
    )
}
