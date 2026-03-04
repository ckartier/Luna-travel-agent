import Link from 'next/link';

export default function CGVPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#faf8f5] to-white">
            <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-4xl mx-auto">
                <Link href="/" className="font-serif text-xl font-semibold text-luna-charcoal">Luna</Link>
                <div className="flex gap-4 text-sm">
                    <Link href="/pricing" className="text-luna-text-muted hover:text-luna-charcoal font-medium">Tarifs</Link>
                    <Link href="/login" className="text-luna-text-muted hover:text-luna-charcoal font-medium">Connexion</Link>
                </div>
            </nav>

            <article className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-headings:font-serif prose-headings:text-luna-charcoal">
                <h1>Conditions Générales de Vente</h1>
                <p className="text-sm text-luna-text-muted">Dernière mise à jour : Mars 2026</p>

                <h2>1. Objet</h2>
                <p>
                    Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent l'utilisation de la plateforme
                    Luna Travel SaaS (ci-après « Luna » ou « la Plateforme »), éditée par Luna Travel SAS, société par actions
                    simplifiée immatriculée au RCS de Paris, mettant à disposition des professionnels du voyage une solution
                    d'intelligence artificielle pour la gestion de leur activité.
                </p>

                <h2>2. Acceptation des CGV</h2>
                <p>
                    L'inscription et l'utilisation de la Plateforme impliquent l'acceptation sans réserve des présentes CGV.
                    Le Client professionnel reconnaît avoir pris connaissance de l'ensemble des présentes conditions avant
                    toute souscription à un abonnement.
                </p>

                <h2>3. Description des Services</h2>
                <p>Luna propose une plateforme SaaS B2B comprenant :</p>
                <ul>
                    <li>Des agents d'intelligence artificielle spécialisés dans la recherche de voyages (vols, hôtels, activités)</li>
                    <li>Un CRM intégré avec gestion de pipeline, contacts, planning et activités</li>
                    <li>Des outils d'analyse et de reporting</li>
                    <li>L'export vers des calendriers tiers (Google Calendar, Apple Calendar)</li>
                    <li>Une boîte de réception email intégrée avec analyse IA</li>
                </ul>

                <h2>4. Abonnements et Tarification</h2>
                <h3>4.1 Formules</h3>
                <p>Trois formules d'abonnement sont proposées :</p>
                <ul>
                    <li><strong>Starter (99€/mois)</strong> : 1 agent IA, 50 leads/mois, CRM basique</li>
                    <li><strong>Pro (249€/mois)</strong> : 5 agents IA, leads illimités, CRM complet</li>
                    <li><strong>Enterprise (499€/mois)</strong> : Agents illimités, API, support dédié, SLA</li>
                </ul>
                <h3>4.2 Facturation</h3>
                <p>
                    Les abonnements sont facturés mensuellement ou annuellement (avec remise de 20%) via Stripe.
                    Toute période entamée est due. Les prix s'entendent hors taxes et sont soumis à la TVA applicable.
                </p>
                <h3>4.3 Paiement</h3>
                <p>
                    Le paiement s'effectue exclusivement par carte bancaire via la plateforme sécurisée Stripe.
                    En cas de défaut de paiement, l'accès à la Plateforme peut être suspendu sans préavis.
                </p>

                <h2>5. Durée et Résiliation</h2>
                <p>
                    L'abonnement est conclu pour une durée indéterminée. Le Client peut résilier à tout moment depuis
                    son espace de gestion. La résiliation prend effet à la fin de la période de facturation en cours.
                    Aucun remboursement ne sera effectué pour la période en cours.
                </p>

                <h2>6. Protection des Données</h2>
                <p>
                    Luna s'engage à respecter la réglementation applicable en matière de protection des données personnelles,
                    notamment le Règlement Général sur la Protection des Données (RGPD). Les données clients sont hébergées
                    sur l'infrastructure Firebase (Google Cloud) en Union Européenne. Le Client reste propriétaire de ses données
                    et peut les exporter ou demander leur suppression à tout moment.
                </p>

                <h2>7. Responsabilité</h2>
                <p>
                    Luna s'engage à fournir un service disponible à 99.5% pour les formules Starter et Pro, et 99.9% pour
                    la formule Enterprise (SLA). Luna ne saurait être tenue responsable des résultats générés par les agents IA,
                    qui constituent des suggestions et non des engagements contractuels. Le Client reste seul responsable
                    de la vérification et de la validation des informations avant toute communication à ses clients finaux.
                </p>

                <h2>8. Propriété Intellectuelle</h2>
                <p>
                    La Plateforme, son code source, son design, ses algorithmes et sa documentation sont la propriété exclusive
                    de Luna Travel SAS. Le Client bénéficie d'un droit d'usage non exclusif, non transférable, limité à la
                    durée de son abonnement.
                </p>

                <h2>9. Modifications des CGV</h2>
                <p>
                    Luna se réserve le droit de modifier les présentes CGV. Les modifications seront notifiées par email
                    30 jours avant leur entrée en vigueur. Le Client qui n'accepte pas les modifications peut résilier
                    son abonnement dans ce délai.
                </p>

                <h2>10. Droit Applicable et Juridiction</h2>
                <p>
                    Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher
                    une solution amiable. À défaut, les tribunaux de Paris seront seuls compétents.
                </p>

                <h2>11. Contact</h2>
                <p>
                    Pour toute question relative aux présentes CGV :<br />
                    <strong>Luna Travel SAS</strong><br />
                    Email : <a href="mailto:legal@luna-travel.io">legal@luna-travel.io</a>
                </p>

                <div className="mt-12 pt-6 border-t border-gray-200 text-center">
                    <Link href="/pricing" className="text-sm text-luna-accent-dark hover:underline font-medium">← Retour aux tarifs</Link>
                </div>
            </article>
        </div>
    );
}
