import Link from "next/link";

// Shown under the sign-up / log-in buttons. Signing in with Google or GitHub
// creates an account too, so it appears on both forms.
const LegalConsentNote = () => (
  <p className="mt-2 text-center text-xs text-muted-foreground">
    By creating an account or logging in, you agree to our{" "}
    <Link href="/terms" className="underline underline-offset-2">
      Terms of Service
    </Link>{" "}
    and{" "}
    <Link href="/privacy" className="underline underline-offset-2">
      Privacy Policy
    </Link>
    .
  </p>
);

export default LegalConsentNote;
