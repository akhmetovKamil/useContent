import { createBrowserRouter } from "react-router-dom"

import { AuthorWorkspacePage } from "../pages/author/AuthorWorkspacePage"
import { RootLayout } from "../pages/layouts/RootLayout"
import { MeAuthorPage } from "../pages/me/MeAuthorPage"
import { MePage } from "../pages/me/MePage"
import { MePostsPage } from "../pages/me/MePostsPage"
import { MeProjectsPage } from "../pages/me/MeProjectsPage"
import { MeSubscriptionPlanPage } from "../pages/me/MeSubscriptionPlanPage"
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
            { path: "author", element: <AuthorWorkspacePage /> },
            { path: "me", element: <MePage /> },
            { path: "me/author", element: <MeAuthorPage /> },
            { path: "me/posts", element: <MePostsPage /> },
            { path: "me/projects", element: <MeProjectsPage /> },
            { path: "me/subscription-plan", element: <MeSubscriptionPlanPage /> },
            { path: "authors/:slug", element: <AuthorPage /> },
            { path: "authors/:slug/posts/:postId", element: <PostPage /> },
            { path: "authors/:slug/projects/:projectId", element: <ProjectPage /> },
        ],
    },
])
