import PageLayout from "@/components/PageLayout";
import BackButton from "@/components/BackButton";

const Members = () => (
    <PageLayout>
        <div className="py-8 sm:py-16 px-4">
    <div className="container-terminal">
        {/* Header */}
        <header className="mb-8">
<BackButton />
<h1 className="text-xl sm:text-2xl text-primary text-glow mt-4">
<span className="text-muted-foreground">user@iswleuven:~$</span> cat ./members
</h1>
<div className="h-px bg-border w-full mt-4" />
    </header>

{/* Mission */}
<section className="mb-12">
<h2 className="text-lg text-primary mb-4">
<span className="text-muted-foreground">$</span> ./what_is_a_member
</h2>
<div className="bg-card border border-border p-4 sm:p-6">
<p className="text-foreground leading-relaxed">
    A member of ISW is a student who is actively involved in the association.
    Members have access to all services and activities offered by ISW, and they can also contribute to the association by participating in projects, events, and committees or just use our services.
    Membership is open to all students who are interested in computer science and want to be part of our club.
</p>
<p className="text-muted-foreground mt-4 text-sm">
# requirements?<br/>
    - Be a student
    - Be interested in computer science
    - 10€ membership fee per school year
</p>
    <p className="text-muted-foreground mt-4 text-sm">
        # How to become a member?<br/>
        - Fill out the membership form
        - Pay the membership fee
    </p>
    <p className="text-muted-foreground mt-4 text-sm">
        # Benefits of being a member?<br />
        - Access to all services and activities offered by ISW <br/>
        for example: <br/>
        ...discount on food and drinks in the room,<br/>
        ...free use of the coffie table / microwave,<br/>
        ...playstation3 games,<br/>
        - Networking with other students and professionals in the field of computer science
    </p>
</div>
</section>

</div>
</div>
</PageLayout>
);

export default Members;
