import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import {
  CONTACT_EMAIL,
  MINIMUM_AGE,
  OPERATOR_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/lib/siteInfo";

export const metadata: Metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: `The rules for using ${SITE_NAME}.`,
};

const Terms = () => {
  return (
    <LegalPage title="Terms of Service">
      <p className="leading-7 text-foreground/90">
        These terms are the agreement between you and {OPERATOR_NAME}, who runs{" "}
        {SITE_NAME} at {SITE_URL} (“we”, “us”). By creating an account or using
        the site, you agree to them and to our{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        . If you don’t agree, please don’t use the site.
      </p>

      <LegalSection title="1. Who can use the site">
        <p>
          You must be at least {MINIMUM_AGE} years old and able to form a
          binding agreement. If you use the site on behalf of an organization,
          you confirm you’re allowed to accept these terms for it.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <ul>
          <li>Give accurate information, and keep your email address current.</li>
          <li>
            Keep your password secret. You’re responsible for what happens
            under your account, so tell us right away if you think someone else
            has used it.
          </li>
          <li>
            You need a verified email address before you can publish posts.
            Drafts can be saved without one.
          </li>
          <li>One person per account, and no creating accounts to evade a ban.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Your content">
        <p>
          You keep ownership of everything you post (your “content”). By
          posting, you give us a worldwide, non-exclusive, royalty-free license
          to host, store, display, reproduce and distribute your content, in
          the formats and ways needed to run the site, for as long as it is on
          the site. This lets us show your posts and comments to others. It
          doesn’t let us sell your content or use it outside the site.
        </p>
        <p>
          You’re responsible for your content. You promise that you own it or
          have the right to post it, and that it doesn’t break the law or
          anyone else’s rights. Published posts and comments are public, so
          anyone may read them.
        </p>
        <p>
          You can edit or delete your posts and comments at any time, and you
          can delete your whole account from Edit Profile. Content you delete
          is removed from the live site, though copies others have made (for
          example by sharing or quoting) may remain.
        </p>
      </LegalSection>

      <LegalSection title="4. What you can’t do">
        <p>Please don’t use {SITE_NAME} to:</p>
        <ul>
          <li>
            post anything illegal, or that infringes someone’s copyright,
            trademark, privacy or other rights;
          </li>
          <li>
            harass, threaten, or incite violence or hatred against any person
            or group, or post sexual content involving minors (which we report
            to the authorities);
          </li>
          <li>
            post spam, scams, malware, phishing, or misleading impersonation of
            another person or organization;
          </li>
          <li>
            collect other people’s personal information without permission;
          </li>
          <li>
            try to break, overload or gain unauthorized access to the site,
            other accounts or our systems, or bypass limits we put in place
            (for example, scraping at scale or automated sign-ups);
          </li>
          <li>
            sell access to your account or use the site for advertising or
            promotion that other users haven’t asked for.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Reporting problems and removing content">
        <p>
          We don’t review everything before it is posted, but we may remove
          content, or suspend or close accounts, if we think these terms are
          broken, if the law requires it, or to protect the site and its users.
          Where practical we’ll tell you why.
        </p>
        <p>
          To report content or ask us to remove material that infringes your
          copyright, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with a link
          to the content, a description of the problem, and your contact
          details. If you think we removed something by mistake, email us and
          we’ll take another look.
        </p>
      </LegalSection>

      <LegalSection title="6. Our site">
        <p>
          The site itself, including its design, code, name and logo, belongs to
          us or our licensors. These terms don’t give you any rights to it
          beyond using the site as intended. Other companies’ names and logos
          that appear on the site belong to them.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-party services">
        <p>
          You can sign in with Google or GitHub, and the site relies on other
          providers for hosting, email and file storage. Their own terms and
          privacy policies apply when you use them, and we aren’t responsible
          for them.
        </p>
      </LegalSection>

      <LegalSection title="8. Ending your use of the site">
        <p>
          You can stop using the site and delete your account at any time. We
          may suspend or close your account if you break these terms or if
          we’re required to by law. When an account is closed, the sections of
          these terms that by their nature should continue (such as the
          disclaimers and limits of liability) will continue.
        </p>
      </LegalSection>

      <LegalSection title="9. No guarantees">
        <p>
          {SITE_NAME} is provided “as is” and “as available”. We work to keep
          it running and safe, but we can’t promise it will always be available,
          error-free or secure, or that content posted by users is accurate.
          Opinions and advice in posts are the authors’ own. Don’t rely on them
          for professional, legal, medical or financial decisions.
        </p>
      </LegalSection>

      <LegalSection title="10. Limits of our liability">
        <p>
          To the fullest extent the law allows, we aren’t liable for indirect or
          consequential losses, lost profits, or lost data arising from your use
          of the site, and our total liability for any claim is limited to
          US$100. Nothing in these terms excludes or limits liability that
          can’t legally be excluded, such as liability for death or personal
          injury caused by negligence, or for fraud, and it doesn’t affect any
          mandatory consumer rights you have in your country.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these terms or the site">
        <p>
          We may change the site or these terms. When we change the terms in a
          significant way, we’ll update the “Last updated” date and let you know
          on the site. If you keep using the site after a change takes effect,
          you accept the new terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>
          These terms are governed by the laws of the United States and the
          state where {OPERATOR_NAME} is based, without regard to conflict-of-law
          rules. If you’re a consumer in the EU, UK or another place with
          mandatory consumer protections, you keep the benefit of those
          protections and any right to bring a claim in your local courts.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
};

export default Terms;
