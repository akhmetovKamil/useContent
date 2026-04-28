import type { ActivityDto } from "@shared/types/content"
import { Bell, Heart, MessageCircle, ReceiptText, Send } from "lucide-react"

export function getActivityIcon(type: ActivityDto["type"]) {
    if (type === "post_liked") {
        return Heart
    }
    if (type === "post_commented") {
        return MessageCircle
    }
    if (type === "new_subscription") {
        return ReceiptText
    }
    if (type === "new_post") {
        return Send
    }
    return Bell
}
