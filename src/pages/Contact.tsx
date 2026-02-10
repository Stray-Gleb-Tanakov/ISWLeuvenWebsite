import { User, Mail, MessageSquare } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";
import { boardMembers } from "@/data/site-data";
const Contact = () => (
  <PageLayout>
    <div className="py-8 sm:py-16 px-4">
      <div className="container-terminal">
        {/* Header */}
        <header className="mb-8">
          <BackButton />
          <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
            <span className="text-muted-foreground">user@iswleuven:~$</span> cat ./contact
          </h1>
          <div className="h-px bg-border w-full mt-4" />
        </header>
        {/* Board / Praesidium */}
        <section className="mb-12">
          <h2 className="text-lg text-primary mb-4">
            <span className="text-muted-foreground">$</span> ls ./praesidium
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardMembers.map((member) => (
              <div key={member.id} className="bg-card border border-border p-4 hover:border-primary transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-foreground font-bold">{member.name}</span>
                </div>
                <p className="text-muted-foreground text-sm"># {member.role}</p>
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs text-primary hover:underline mt-2">
                    <Mail className="w-3 h-3" />
                    {member.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
        {/* General Contact */}
        <section>
          <h2 className="text-lg text-primary mb-4">
            <span className="text-muted-foreground">$</span> ./reach-out
          </h2>
          <div className="bg-card border border-border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-foreground font-bold">Get in Touch</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              # Have a question, suggestion, or want to collaborate? Reach out to any board member above or send a general inquiry to{" "}
              <a href="mailto:isw@ucll.be" className="text-primary hover:underline">isw@ucll.be</a>.
              Or visit us in person at our room on the Connect campus (in the basement of the B-block). We're usually around between 9am and 9pm!
            </p>
          </div>
        </section>
      </div>
    </div>
  </PageLayout>
);
export default Contact;