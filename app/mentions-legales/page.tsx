import NavAndFooter from '../conciergerie/NavAndFooter';

export const metadata = {
    title: 'Mentions Légales | Luna Conciergerie',
    description: 'Mentions légales et informations éditoriales.',
};

export default function MentionsLegalesPage() {
    return (
        <NavAndFooter>
            <div className="pt-32 pb-24 max-w-4xl mx-auto px-6 md:px-12 font-sans text-luna-charcoal">
                <h1 className="text-4xl md:text-5xl font-serif mb-12">Mentions Légales</h1>
                
                <div className="space-y-8 text-[15px] font-light leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Éditeur du site</h2>
                        <p><strong>Luna Conciergerie</strong><br/>
                        SAS au capital de 10 000€<br/>
                        RCS Paris B 123 456 789<br/>
                        Siège social : 1 avenue des Champs-Élysées, 75008 Paris<br/>
                        Email : contact@luna-conciergerie.com<br/>
                        Téléphone : +33 (0) 1 00 00 00 00</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">2. Directeur de la publication</h2>
                        <p>Le directeur de la publication est le représentant légal de Luna Conciergerie.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">3. Hébergement</h2>
                        <p>Ce site est hébergé par Vercel Inc.<br/>
                        340 S Lemon Ave #4133 Walnut, CA 91789, USA.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">4. Propriété intellectuelle</h2>
                        <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.</p>
                    </section>
                </div>
            </div>
        </NavAndFooter>
    );
}
