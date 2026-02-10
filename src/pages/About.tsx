import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";

const About = () => (
  <PageLayout>
    <div className="py-8 sm:py-16 px-4">
      <div className="container-terminal">
        {/* Header */}
        <header className="mb-8">
          <BackButton />
          <h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
            <span className="text-muted-foreground">user@iswleuven:~$</span> cat ./about
          </h1>
          <div className="h-px bg-border w-full mt-4" />
        </header>

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-lg text-primary mb-4">
            <span className="text-muted-foreground">$</span> ./mission
          </h2>
          <div className="bg-card border border-border p-4 sm:p-6">
            <p className="text-foreground leading-relaxed">
              ISW (Informatics Student Working) is an association for and by students who like to be involved in computer science.
              We give students the opportunity to share their knowledge with other students and gain a lot of experience.  
              ISW endeavors to bundle this experience and knowledge as much as possible, in order to achieve a whole range of services and activities that we offer to students.
            </p>
            <p className="text-muted-foreground mt-4 text-sm">
              # Where? 
            On Connect campus (in the basement of the B-block). Once in the B-block there are arrows that lead you to our room. 
             <p className="text-muted-foreground mt-4 text-sm">
              # When? 
            There is usually someone present in the room between 9am and 9pm.
             </p>
              <p className="text-muted-foreground mt-4 text-sm">
              # For whom?
          Students who like to be involved in computer science, or require ICT Support
             </p>
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="mb-12">
          <h2 className="text-lg text-primary mb-4">
            <span className="text-muted-foreground">$</span> ./services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
              { title: "Examenwiki", desc: "Access past exams and study materials", href: "/resources" },
              { title: "Cantussen", desc: "Traditional singing nights and parties", href: "/events" },
              { title: "TD's", desc: "Theme parties throughout the year", href: "/events" },
              { title: "Bedrijfsbezoeken", desc: "Company visits and career opportunities", href: "/events" },
            ].map((item) => (
               <a key={item.title} href={item.href} className="bg-card border border-border p-4 hover:border-primary transition-colors block terminal-btn">
                <h3 className="text-primary font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm mt-1"># {item.desc}</p>
              </a>
            ))}
          </div>
        </section>

        
      </div>
    </div>
  </PageLayout>
);

export default About;
