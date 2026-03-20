import NavAndFooter from '../conciergerie/NavAndFooter';

export const metadata = {
    title: 'Politique des Cookies | Luna Conciergerie',
    description: 'Informations sur l\'utilisation des cookies sur notre site.',
};

export default function CookiesPage() {
    return (
        <NavAndFooter>
            <div className="pt-32 pb-24 max-w-4xl mx-auto px-6 md:px-12 font-sans text-luna-charcoal">
                <h1 className="text-4xl md:text-5xl font-serif mb-12">Politique des Cookies</h1>
                
                <div className="space-y-8 text-[15px] font-light leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Qu'est-ce qu'un cookie ?</h2>
                        <p>Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site ou de la consultation d'une publicité. Il permet de conserver des données utilisateur afin de faciliter la navigation et de permettre certaines fonctionnalités.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">2. Les cookies que nous utilisons</h2>
                        <ul className="list-disc pl-6 space-y-4">
                            <li><strong>Cookies strictement nécessaires :</strong> Indispensables au fonctionnement du site, ils vous permettent d'utiliser les principales fonctionnalités et de sécuriser votre connexion.</li>
                            <li><strong>Cookies de performance et d'analyse :</strong> Ils nous permettent de connaître l'utilisation et les performances de notre site et d'en améliorer le fonctionnement (par exemple, les pages le plus souvent consultées).</li>
                            <li><strong>Cookies fonctionnels :</strong> Ils permettent de mémoriser vos choix et préférences pour vous proposer une navigation personnalisée.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold mb-4">3. Gestion de vos préférences</h2>
                        <p>Vous pouvez à tout moment configurer votre logiciel de navigation de manière à ce que des cookies soient enregistrés dans votre terminal ou, au contraire, qu'ils soient rejetés, soit systématiquement, soit selon leur émetteur.</p>
                    </section>
                </div>
            </div>
        </NavAndFooter>
    );
}
