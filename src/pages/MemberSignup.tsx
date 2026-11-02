import { FormEvent, useState } from "react";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { MEMBERS_EMAIL, MemberRecord, submitMemberSignup } from "@/lib/members";

const IBAN = "BE03 7330 2225 7284";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

const Field = ({ id, label, hint, required, type = "text", value, onChange, error }: FieldProps) => (
  <div className="bg-card border border-border p-4 sm:p-6 focus-within:border-primary transition-colors">
    <label htmlFor={id} className="text-foreground block">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {hint && <p className="text-muted-foreground text-sm italic mt-1">{hint}</p>}
    <div className="flex items-center gap-2 mt-4">
      <span className="text-muted-foreground">&gt;</span>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="your answer"
        className="w-full bg-transparent border-b border-border focus:border-primary outline-none py-1 text-foreground font-mono placeholder:text-muted-foreground/50"
      />
    </div>
    {error && <p className="text-destructive text-sm mt-2"># {error}</p>}
  </div>
);

const MemberSignup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [website, setWebsite] = useState("");
  const [studentNumberError, setStudentNumberError] = useState<string>();
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState<MemberRecord | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // forgive a leading 'r' even though we asked people not to type it
    const digits = studentNumber.trim().replace(/^r/i, "");
    if (digits && !/^\d+$/.test(digits)) {
      setStudentNumberError("digits only, e.g. 1048153");
      return;
    }
    setStudentNumberError(undefined);
    setError(undefined);
    setSending(true);
    try {
      setSubmitted(
        await submitMemberSignup({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          studentNumber: digits || null,
          email: email.trim(),
          discord: discord.trim() || null,
          website,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout>
      <div className="py-8 sm:py-16 px-4">
        <div className="container-terminal">
          <header className="mb-8">
            <BackButton />
            <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
              <span className="text-muted-foreground">user@iswleuven:~$</span> ./member_signup
            </h1>
            <div className="h-px bg-border w-full mt-4" />
          </header>

          {submitted ? (
            <section className="bg-card border border-primary p-4 sm:p-6 space-y-3">
              <p className="text-primary text-glow">&gt; sign-up received. one step left.</p>
              <p className="text-muted-foreground text-sm"># the board got this:</p>
              <pre className="bg-background border border-border p-3 text-xs overflow-x-auto">{JSON.stringify(submitted, null, 2)}</pre>
              <p className="text-muted-foreground text-sm">
                # then transfer 10€ to <span className="text-foreground font-bold">{IBAN}</span> with "membership sign-up" and your student number in the message.
              </p>
            </section>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field id="firstName" label="First Name" required value={firstName} onChange={setFirstName} />
              <Field id="lastName" label="Last Name" required value={lastName} onChange={setLastName} />
              <Field
                id="studentNumber"
                label="Student Number (e.g. r1048153)"
                hint="don't add the 'r'"
                value={studentNumber}
                onChange={setStudentNumber}
                error={studentNumberError}
              />
              <Field id="email" label="Email (one you want to use for ISW stuff)" type="email" required value={email} onChange={setEmail} />
              <Field id="discord" label="Discord username (if you have one)" value={discord} onChange={setDiscord} />
              {/* Honeypot for bots: hidden from people and screen readers */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="absolute -left-[9999px] w-px h-px opacity-0"
              />

              <div className="bg-card border border-border p-4 sm:p-6">
                <p className="text-foreground">
                  Bank Account: <span className="font-bold">{IBAN}</span>
                </p>
                <p className="text-foreground mt-6">Payment information:</p>
                <ul className="text-muted-foreground text-sm mt-2 space-y-1">
                  <li>- In order to be a member, you need to pay: 10 Euros</li>
                  <li>- This will be for 1 year (2 semesters)</li>
                  <li>
                    - Please specify in the <span className="text-foreground font-bold">Transfer message</span> that the money is for membership sign-up, and add your student number.
                  </li>
                </ul>
              </div>

              {error && (
                <p className="text-destructive text-sm">
                  # sign-up failed: {error}. try again, or mail{" "}
                  <a href={`mailto:${MEMBERS_EMAIL}`} className="text-primary hover:underline">{MEMBERS_EMAIL}</a>.
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="terminal-btn block w-full px-4 py-3 sm:py-4 bg-secondary border border-primary text-primary text-left font-mono text-sm sm:text-base hover:bg-primary hover:text-primary-foreground transition-all duration-200 disabled:opacity-60"
              >
                <span className="text-muted-foreground">$</span> {sending ? "submitting..." : "submit"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default MemberSignup;
