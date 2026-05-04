import { useEffect, useState } from "react"

import { AppearancePicker } from "@/components/settings/AppearancePicker"
import { ProfileAvatarPicker } from "@/components/common/ProfileAvatarPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eyebrow, PageSection } from "@/components/ui/page"
import { Textarea } from "@/components/ui/textarea"
import {
    useMeQuery,
    useUpdateMeMutation,
    useUploadMyProfileAvatarMutation,
} from "@/queries/profile"
import { useAuthStore } from "@/stores/auth-store"

export function MePage() {
    const token = useAuthStore((state) => state.token)
    const meQuery = useMeQuery(Boolean(token))
    const updateMeMutation = useUpdateMeMutation()
    const uploadAvatarMutation = useUploadMyProfileAvatarMutation()
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")

    useEffect(() => {
        if (!meQuery.data) {
            return
        }

        setUsername(meQuery.data.username ?? "")
        setDisplayName(meQuery.data.displayName)
        setBio(meQuery.data.bio)
    }, [meQuery.data])

    return (
        <PageSection>
            <Eyebrow>user settings</Eyebrow>
            <h2 className="mt-3 font-[var(--serif)] text-3xl text-[var(--foreground)]">
                User settings
            </h2>
            {!token ? (
                <p className="mt-3 max-w-2xl text-[var(--muted)]">
                    Connect a wallet and sign the message in the top-right block to see your
                    personal dashboard and active access grants.
                </p>
            ) : meQuery.isLoading ? (
                <p className="mt-3 max-w-2xl text-[var(--muted)]">Loading profile...</p>
            ) : meQuery.isError ? (
                <p className="mt-3 max-w-2xl text-rose-600">
                    Failed to load profile: {meQuery.error.message}
                </p>
            ) : meQuery.data ? (
                <div className="mt-6 grid gap-6">
                    <AppearancePicker />
                    <ProfileAvatarPicker
                        avatarFileId={meQuery.data.avatarFileId}
                        error={uploadAvatarMutation.error?.message ?? null}
                        isPending={uploadAvatarMutation.isPending}
                        label={displayName || username || "User"}
                        onChange={(file) => uploadAvatarMutation.mutate(file)}
                    />

                    <form
                        className="grid gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void updateMeMutation.mutateAsync({
                                username: username || null,
                                displayName,
                                bio,
                            })
                        }}
                    >
                        <Eyebrow className="tracking-[0.3em]">edit profile</Eyebrow>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Label>
                                Username
                                <Input
                                    onChange={(event) => setUsername(event.target.value)}
                                    value={username}
                                />
                            </Label>
                            <Label>
                                Display name
                                <Input
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    value={displayName}
                                />
                            </Label>
                        </div>
                        <Label>
                            Bio
                            <Textarea
                                onChange={(event) => setBio(event.target.value)}
                                value={bio}
                            />
                        </Label>
                        {updateMeMutation.isError ? (
                            <p className="text-sm text-rose-600">
                                {updateMeMutation.error.message}
                            </p>
                        ) : null}
                        <Button
                            className="w-fit rounded-full"
                            disabled={updateMeMutation.isPending}
                            type="submit"
                        >
                            {updateMeMutation.isPending ? "Saving..." : "Save profile"}
                        </Button>
                    </form>
                </div>
            ) : null}
        </PageSection>
    )
}
