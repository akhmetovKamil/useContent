import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function ActionLink({ label, to }: { label: string; to: string }) {
    return (
        <Button asChild className="justify-start rounded-full" variant="outline">
            <Link to={to}>{label}</Link>
        </Button>
    )
}
