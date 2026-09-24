import PageLayout from "../components/PageLayout";

const PrivacyPolicy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      subtitle="How ISW handles your personal data"
    >
      <article className="mx-auto max-w-4xl space-y-10">
        <div className="border border-green-500/40 bg-black/30 p-4 font-mono text-sm text-green-300">
          <p>
            <span className="text-green-500">$</span> last_updated
          </p>
          <p className="mt-1 text-green-200">
            Last updated: 24 September 2026
          </p>
        </div>

        <section className="space-y-4">
          <p>
            We are a de facto association (
            <em>feitelijke vereniging</em>) under Belgian law. The board of ISW
            is responsible for processing your personal data.
          </p>

          <p>
            This privacy policy explains how we collect, use, and protect your
            personal information in accordance with the EU General Data
            Protection Regulation (GDPR).
          </p>
        </section>

        <PrivacySection number="1" title="Who we are">
          <div className="space-y-2">
            <p>
              <strong>Organisation:</strong> ISW
            </p>
            <p>
              <strong>Legal form:</strong> De facto association (
              <em>feitelijke vereniging</em>)
            </p>
            <p>
              <strong>Contact:</strong>{" "}
              <a href="mailto:isw@ucll.be" className="terminal-link">
                isw@ucll.be
              </a>
            </p>
            <p>
              <strong>Address:</strong> Geldenaaksebaan 335
            </p>
          </div>

          <p className="mt-4">
            As a <em>feitelijke vereniging</em>, we do not have separate legal
            personality. The board members are jointly responsible for
            compliance with data protection and accounting rules.
          </p>
        </PrivacySection>

        <PrivacySection number="2" title="What personal data we collect">
          <p>
            We typically collect and process the following categories of
            personal data:
          </p>

          <Subsection title="Identification and contact data">
            <BulletList
              items={[
                "First name and last name",
                "Email address",
                "Optionally: phone number, student number, and study programme",
              ]}
            />
          </Subsection>

          <Subsection title="Membership data">
            <BulletList
              items={[
                "Membership year / academic year",
                "Membership status (active / inactive)",
                "Date of last activity, such as the last event attended or last email interaction",
              ]}
            />
          </Subsection>

          <Subsection title="Payment data for the €10 membership fee">
            <BulletList
              items={[
                "Amount paid (€10)",
                "Date of payment",
                "Bank transaction reference from your bank transfer",
                "Name as it appears on the bank transfer",
              ]}
            />
          </Subsection>

          <p className="mt-4">
            We do not collect special categories of data, such as health data
            or political opinions, unless strictly necessary for a specific
            activity. If we ever need to do so, we will inform you separately
            and obtain your explicit consent where required.
          </p>
        </PrivacySection>

        <PrivacySection number="3" title="Why we process your data">
          <p>We process your personal data for the following purposes:</p>

          <Subsection title="Membership administration">
            <BulletList
              items={[
                "Managing your membership",
                "Verifying that you have paid the €10 membership fee",
                "Keeping an internal list of members",
              ]}
            />
          </Subsection>

          <Subsection title="Club communication">
            <BulletList
              items={[
                "Sending emails about meetings, events, and club activities",
                "Sharing practical information relevant to members",
              ]}
            />
          </Subsection>

          <Subsection title="Event organisation">
            <BulletList
              items={[
                "Managing registrations for events",
                "Communicating practical details such as location, time, and changes",
              ]}
            />
          </Subsection>

          <Subsection title="Accounting and legal obligations">
            <BulletList
              items={[
                "Keeping proof of membership fee payments",
                "Complying with Belgian accounting and tax retention rules",
              ]}
            />
          </Subsection>

          <p className="mt-4">
            Our legal bases for processing are:
          </p>

          <BulletList
            items={[
              "Performance of our membership relationship and our legitimate interests as a student club, for membership administration and essential communications.",
              "Legal obligation, for retaining accounting and payment-related data.",
              "Consent, where applicable, for example for optional newsletters, photos, or sharing data with third parties.",
            ]}
          />
        </PrivacySection>

        <PrivacySection number="4" title="How long we keep your data">
          <p>
            We do not keep your personal data longer than necessary. Our
            retention periods are described below.
          </p>

          <Subsection title="4.1 Contact and membership data">
            <p>
              Name, email, membership status, and last activity date are kept
              while you are an active member.
            </p>

            <p>
              After your membership ends or you become inactive, we keep this
              data for up to 2 academic years after your last activity, such as
              your last event attendance or email interaction.
            </p>

            <p>
              After this period, we delete or anonymize your contact data for
              regular club communications.
            </p>

            <p>
              You can ask us to delete your contact data earlier. We will do so
              unless we must keep it for legal reasons, as described below.
            </p>
          </Subsection>

          <Subsection title="4.2 Payment and accounting data">
            <p>
              Data related to your €10 membership fee, including the amount,
              date, bank reference, and your name as it appears on the transfer,
              is kept for 7 years from 1 January after the financial year in
              which the payment was made.
            </p>

            <p>
              We may keep these records for up to 10 years as a precaution for
              tax purposes.
            </p>

            <p>
              This longer retention is allowed under the GDPR because we have a
              legal obligation to retain accounting documents.
            </p>
          </Subsection>
        </PrivacySection>

        <PrivacySection number="5" title="Who has access to your data">
          <p>
            Access to your personal data is limited to board members who need it
            to perform their tasks, such as the chair, treasurer, or membership
            coordinator.
          </p>

          <p className="mt-4">
            Third parties may access your data only when strictly necessary and
            compliant with GDPR, such as:
          </p>

          <BulletList
            items={[
              "Our bank, for receiving membership fees",
              "IT providers, such as email services, where they act as processors under appropriate safeguards",
            ]}
          />

          <p className="mt-4">
            We do not sell or share your data with third parties for marketing
            purposes.
          </p>
        </PrivacySection>

        <PrivacySection number="6" title="Your rights">
          <p>
            Under the GDPR, you have the following rights regarding your
            personal data:
          </p>

          <BulletList
            items={[
              "Right of access: You can ask us what data we hold about you and receive a copy.",
              "Right to rectification: You can ask us to correct inaccurate or incomplete data.",
              "Right to erasure: You can ask us to delete your data, subject to legal obligations such as accounting records.",
              "Right to restriction of processing: You can ask us to limit how we use your data in certain situations.",
              "Right to object: You can object to certain types of processing, such as sending non-essential communications.",
              "Right to data portability: Where applicable, you can ask us to provide your data in a structured, commonly used format.",
            ]}
          />

          <p className="mt-4">
            To exercise any of these rights, please contact us at:{" "}
            <a href="mailto:isw@ucll.be" className="terminal-link">
              isw@ucll.be
            </a>
          </p>

          <p>
            We will respond within one month of your request, as required by the
            GDPR.
          </p>

          <p>
            If you believe we are not complying with data protection rules, you
            also have the right to lodge a complaint with the Belgian Data
            Protection Authority:
          </p>

          <a
            href="https://www.autoriteprotectiondonnees.be"
            target="_blank"
            rel="noreferrer"
            className="terminal-link inline-block"
          >
            autoriteprotectiondonnees.be
          </a>
        </PrivacySection>

        <PrivacySection number="7" title="Data security">
          <p>
            We take appropriate technical and organisational measures to
            protect your personal data, including:
          </p>

          <BulletList
            items={[
              "Storing data in password-protected files and/or secure cloud services",
              "Limiting access to board members only",
              "Not sharing membership lists publicly",
              "Deleting or anonymizing data when it is no longer needed",
            ]}
          />
        </PrivacySection>

        <PrivacySection number="8" title="Changes to this privacy policy">
          <p>
            We may update this privacy policy from time to time, for example if
            our activities or legal obligations change.
          </p>

          <p>
            The latest version will always be available on our website or upon
            request.
          </p>
        </PrivacySection>

        <PrivacySection number="9" title="Contact">
          <p>
            If you have any questions about this privacy policy or our
            processing of your personal data, please contact us at:
          </p>

          <p className="mt-4">
            <strong>Email:</strong>{" "}
            <a href="mailto:isw@ucll.be" className="terminal-link">
              isw@ucll.be
            </a>
          </p>
        </PrivacySection>

        <div className="border-t border-green-500/30 pt-6 font-mono text-sm text-green-400/70">
          <p>
            <span className="text-green-500">$</span> policy.status
          </p>
          <p className="mt-1">active // last reviewed 24-09-2026</p>
        </div>
      </article>
    </PageLayout>
  );
};

type PrivacySectionProps = {
  number: string;
  title: string;
  children: React.ReactNode;
};

const PrivacySection = ({
  number,
  title,
  children,
}: PrivacySectionProps) => {
  return (
    <section className="space-y-4">
      <h2 className="font-mono text-xl font-bold text-green-300">
        <span className="mr-2 text-green-500">{number}.</span>
        {title}
      </h2>

      <div className="space-y-4 leading-7 text-green-100/90">
        {children}
      </div>
    </section>
  );
};

const Subsection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="mt-6 space-y-3 border-l border-green-500/30 pl-4">
      <h3 className="font-mono text-base font-semibold text-green-400">
        {title}
      </h3>

      <div className="space-y-3">{children}</div>
    </div>
  );
};

const BulletList = ({ items }: { items: string[] }) => {
  return (
    <ul className="space-y-2 pl-5">
      {items.map((item) => (
        <li key={item} className="list-disc marker:text-green-500">
          {item}
        </li>
      ))}
    </ul>
  );
};

export default PrivacyPolicy;