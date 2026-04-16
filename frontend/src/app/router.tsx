import { createBrowserRouter } from "react-router-dom"

import { RequireAuthor, RequireSession } from "@/components/routing/AuthGuards"
import { AuthorAboutPage } from "../pages/author/AuthorAboutPage"
import { AuthorOnboardingPage } from "../pages/author/AuthorOnboardingPage"
import { AuthorWorkspacePage } from "../pages/author/AuthorWorkspacePage"
import { RootLayout } from "../pages/layouts/RootLayout"
import { MeAuthorPage } from "../pages/me/MeAuthorPage"
import { MePage } from "../pages/me/MePage"
import { MePostsPage } from "../pages/me/MePostsPage"
import { MeProfilePage } from "../pages/me/MeProfilePage"
import { MeProjectsPage } from "../pages/me/MeProjectsPage"
import { MeSubscribersPage } from "../pages/me/MeSubscribersPage"
import { MeSubscriptionPlanPage } from "../pages/me/MeSubscriptionPlanPage"
import { MeSubscriptionsPage } from "../pages/me/MeSubscriptionsPage"
import { AuthorPage } from "../pages/public/AuthorPage"
import { HomePage } from "../pages/public/HomePage"
import { PostPage } from "../pages/public/PostPage"
import { ProjectPage } from "../pages/public/ProjectPage"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            { index: true, element: <HomePage /> },
            {
                element: <RequireSession />,
                children: [
                    { path: "me", element: <MePage /> },
                    { path: "me/settings", element: <MePage /> },
                    { path: "me/profile", element: <MeProfilePage /> },
                    { path: "me/subscriptions", element: <MeSubscriptionsPage /> },
                    { path: "author/about", element: <AuthorAboutPage /> },
                    { path: "author/onboarding", element: <AuthorOnboardingPage /> },
                ],
            },
            {
                element: <RequireAuthor />,
                children: [
                    { path: "author", element: <AuthorWorkspacePage /> },
                    { path: "me/author", element: <MeAuthorPage /> },
                    { path: "me/subscribers", element: <MeSubscribersPage /> },
                    { path: "me/posts", element: <MePostsPage /> },
                    { path: "me/projects", element: <MeProjectsPage /> },
                    { path: "me/subscription-plan", element: <MeSubscriptionPlanPage /> },
                ],
            },
            { path: "authors/:slug", element: <AuthorPage /> },
            { path: "authors/:slug/posts/:postId", element: <PostPage /> },
            { path: "authors/:slug/projects/:projectId", element: <ProjectPage /> },
        ],
    },
])
