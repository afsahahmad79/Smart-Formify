import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    "/",
    "/about",
    "/contact",
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/verify-email",
    "/api/webhooks/clerk",
    "/forms/(.*)", // Public form pages
]);

export default clerkMiddleware(async (auth, req) => {
    try {
        // Protect all routes except public ones
        if (!isPublicRoute(req)) {
            await auth.protect();
        }
    } catch (error) {
        throw error;
    }
});

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

