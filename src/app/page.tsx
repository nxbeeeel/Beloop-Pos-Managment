"use client";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { POSShell } from "@/components/POSShell";

export default function HomePage() {
    return (
        <>
            <SignedIn>
                <POSShell />
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </>
    );
}
