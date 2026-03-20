import NavAndFooter from '../conciergerie/NavAndFooter';

export const metadata = {
    title: 'Politique de Confidentialité | Luna Conciergerie',
    description: 'Politique de protection des données personnelles et respect de la vie privée.',
};

export default function ConfidentialitePage() {
    return (
        <NavAndFooter>
            <div className="pt-32 pb-24 max-w-4xl mx-auto px-6 md:px-12 font-sans text-luna-charcoal">
                <h1 className="text-4xl md:text-5xl font-serif mb-12">Politique de Confidentialité</h1>
                
                <div className="space-y-8 text-[15px] font-light leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Collecte des données</h2>
                        <p>Nous collectons les données que vous nous communiquez expressément lors de vos demandes d'informations, demandes de devis, ou inscription à nos services. Ces données peuvent inclure : nom, prénom, adresse email, numéro de téléphone, et préférences de voyage.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">2. Utilisation des données</h2>
                        <p>Vos données sont utilisées exclusivement pour :</p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>L'élaboration de vos projets de voyage</li>
                            <li>La gestion de vos réservations</li>
                            <li>La communication concernant nos offres (avec votre accord)</li>
                            <li>L'amélioration de nos services</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">3. Protection et Partage</h2>
                        <p>Nous ne vendons ni ne louons vos données personnelles à des tiers. Elles ne sont partagées qu'avec nos partenaires de voyage (compagnies aériennes, hôtels, réceptifs) dans la stricte mesure nécessaire à l'exécution de vos réservations.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">4. Vos droits RGPD</h2>
                        <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement, et de portabilité de vos données. Pour exercer ces droits, contactez-nous à : privacy@luna-conciergerie.com.</p>
                    </section>
                </div>
            </div>
        </NavAndFooter>
    );
}
