import { useState, useMemo } from 'react';
import { Projet } from '../types';
import { calculerPlanningAchats, formaterDate, obtenirCouleurUrgence } from '../utils/planificationMateriaux';
import './CalendrierAchats.css';

interface CalendrierAchatsProps {
    projets: Projet[];
}

interface EvenementCalendrier {
    date: Date;
    materiels: Array<{
        nom: string;
        projet: string;
        urgence: 'critique' | 'attention' | 'normal';
        joursRestants: number;
    }>;
}

export default function CalendrierAchats({ projets }: CalendrierAchatsProps) {
    const [moisActuel, setMoisActuel] = useState(new Date());

    const { evenements, moisPrecedent, moisSuivant } = useMemo(() => {
        const planning = calculerPlanningAchats(projets);

        // Créer les événements du calendrier
        const evenementsMap = new Map<string, EvenementCalendrier>();

        planning.forEach(item => {
            const dateStr = item.dateCommandeOptimale.toDateString();
            if (!evenementsMap.has(dateStr)) {
                evenementsMap.set(dateStr, {
                    date: item.dateCommandeOptimale,
                    materiels: []
                });
            }

            evenementsMap.get(dateStr)!.materiels.push({
                nom: item.materiel.nom,
                projet: item.projet.nom,
                urgence: item.urgence,
                joursRestants: item.joursRestants
            });
        });

        const moisPrec = new Date(moisActuel.getFullYear(), moisActuel.getMonth() - 1, 1);
        const moisSuiv = new Date(moisActuel.getFullYear(), moisActuel.getMonth() + 1, 1);

        return {
            evenements: Array.from(evenementsMap.values()),
            moisPrecedent: moisPrec,
            moisSuivant: moisSuiv
        };
    }, [projets, moisActuel]);

    // Générer les jours du calendrier
    const joursCalendrier = useMemo(() => {
        const premierJour = new Date(moisActuel.getFullYear(), moisActuel.getMonth(), 1);

        // Commencer le calendrier par lundi
        const premierJourSemaine = premierJour.getDay() || 7; // Dimanche = 7
        const dateDebut = new Date(premierJour);
        dateDebut.setDate(dateDebut.getDate() - (premierJourSemaine - 1));

        const jours = [];
        const dateActuelle = new Date(dateDebut);

        // Générer 6 semaines (42 jours)
        for (let i = 0; i < 42; i++) {
            const dateStr = dateActuelle.toDateString();
            const evenement = evenements.find(e => e.date.toDateString() === dateStr);

            jours.push({
                date: new Date(dateActuelle),
                estDansLeMois: dateActuelle.getMonth() === moisActuel.getMonth(),
                estAujourdhui: dateActuelle.toDateString() === new Date().toDateString(),
                evenement
            });

            dateActuelle.setDate(dateActuelle.getDate() + 1);
        }

        return jours;
    }, [moisActuel, evenements]);

    const naviguerMois = (direction: 'precedent' | 'suivant') => {
        if (direction === 'precedent') {
            setMoisActuel(moisPrecedent);
        } else {
            setMoisActuel(moisSuivant);
        }
    };

    const nomMois = moisActuel.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="calendrier-achats">
            {/* En-tête du calendrier */}
            <div className="calendrier-header">
                <button
                    className="nav-mois"
                    onClick={() => naviguerMois('precedent')}
                    title="Mois précédent"
                >
                    ‹
                </button>
                <h3 className="titre-mois">{nomMois}</h3>
                <button
                    className="nav-mois"
                    onClick={() => naviguerMois('suivant')}
                    title="Mois suivant"
                >
                    ›
                </button>
            </div>

            {/* Jours de la semaine */}
            <div className="jours-semaine">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(jour => (
                    <div key={jour} className="jour-semaine">
                        {jour}
                    </div>
                ))}
            </div>

            {/* Grille du calendrier */}
            <div className="grille-calendrier">
                {joursCalendrier.map((jour, index) => (
                    <div
                        key={index}
                        className={`
                            jour-calendrier
                            ${!jour.estDansLeMois ? 'hors-mois' : ''}
                            ${jour.estAujourdhui ? 'aujourdhui' : ''}
                            ${jour.evenement ? 'avec-evenement' : ''}
                        `}
                    >
                        <div className="numero-jour">
                            {jour.date.getDate()}
                        </div>

                        {jour.evenement && (
                            <div className="evenements">
                                {jour.evenement.materiels.slice(0, 3).map((materiel, idx) => (
                                    <div
                                        key={idx}
                                        className={`evenement ${materiel.urgence}`}
                                        title={`${materiel.nom} - ${materiel.projet} (${materiel.joursRestants > 0 ? `${materiel.joursRestants}j` : 'En retard'})`}
                                    >
                                        <span className="materiel-nom">
                                            {materiel.nom.length > 15
                                                ? materiel.nom.substring(0, 15) + '...'
                                                : materiel.nom
                                            }
                                        </span>
                                    </div>
                                ))}
                                {jour.evenement.materiels.length > 3 && (
                                    <div className="evenement-plus">
                                        +{jour.evenement.materiels.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Légende */}
            <div className="calendrier-legende">
                <h4>Légende :</h4>
                <div className="legende-items">
                    <div className="legende-item">
                        <div className="dot critique"></div>
                        <span>Urgent (≤ 7 jours)</span>
                    </div>
                    <div className="legende-item">
                        <div className="dot attention"></div>
                        <span>Attention (≤ 30 jours)</span>
                    </div>
                    <div className="legende-item">
                        <div className="dot normal"></div>
                        <span>Normal (&gt; 30 jours)</span>
                    </div>
                </div>
            </div>

            {/* Résumé des prochains achats */}
            <div className="prochains-achats">
                <h4>📋 Prochains achats (7 prochains jours) :</h4>
                {evenements
                    .filter(e => {
                        const maintenant = new Date();
                        const septJours = new Date();
                        septJours.setDate(septJours.getDate() + 7);
                        return e.date >= maintenant && e.date <= septJours;
                    })
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .slice(0, 5)
                    .map((evenement, index) => (
                        <div key={index} className="prochain-achat">
                            <div className="achat-date">
                                <strong>{formaterDate(evenement.date)}</strong>
                            </div>
                            <div className="achat-materiels">
                                {evenement.materiels.map((materiel, idx) => (
                                    <span
                                        key={idx}
                                        className={`badge ${materiel.urgence}`}
                                        style={{ color: obtenirCouleurUrgence(materiel.joursRestants) }}
                                    >
                                        {materiel.nom} ({materiel.projet})
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                }
                {evenements.filter(e => {
                    const maintenant = new Date();
                    const septJours = new Date();
                    septJours.setDate(septJours.getDate() + 7);
                    return e.date >= maintenant && e.date <= septJours;
                }).length === 0 && (
                        <p className="aucun-achat">
                            ✅ Aucun achat urgent dans les 7 prochains jours
                        </p>
                    )}
            </div>
        </div>
    );
}
