import { Projet, StatutTache, EtapeProduction, ChangementStatut } from '../types';
import './DetailProjet.css';

interface DetailProjetProps {
    projet: Projet;
    onUpdateProjet: (projet: Projet) => void;
    onRetour: () => void;
}

const LABELS_ETAPES: Record<EtapeProduction, string> = {
    achat: 'Achat des composants',
    coupe_materiel: 'Coupe de matériel',
    pre_assemblage_electrique: 'Pré-assemblage électrique',
    soudage: 'Soudage',
    peinture_externe: 'Peinture (externe)',
    assemblage: 'Assemblage',
    assemblage_electrique_final: 'Assemblage électrique final',
    test_qualite: 'Test qualité',
    test_logiciel: 'Test logiciel (équipe externe)'
};

const COULEURS_STATUT: Record<StatutTache, string> = {
    en_attente: '#fbbf24', // Amber
    en_cours: '#3b82f6',   // Blue
    termine: '#10b981',    // Green
    bloque: '#ef4444'      // Red
};

export default function DetailProjet({ projet, onUpdateProjet, onRetour }: DetailProjetProps) {

    const calculerProgression = () => {
        const etapesTerminees = projet.etapes.filter(e => e.statut === 'termine').length;
        return Math.round((etapesTerminees / projet.etapes.length) * 100);
    };

    const calculerHeuresRestantes = () => {
        return projet.etapes
            .filter(e => e.statut !== 'termine')
            .reduce((total, etape) => total + etape.heuresEstimees, 0);
    };

    const calculerHeuresTerminees = () => {
        return projet.etapes
            .filter(e => e.statut === 'termine')
            .reduce((total, etape) => total + etape.heuresEstimees, 0);
    };

    // Nouvelles fonctions pour les temps réels
    const calculerTempsReel = (etape: any) => {
        if (!etape.tempsReel) return 0;

        let tempsTotal = etape.tempsReel.tempsTotal;

        // Si l'étape est en cours, ajouter le temps depuis le dernier démarrage
        if (etape.statut === 'en_cours' && etape.tempsReel.dateDebut) {
            const maintenant = new Date();
            const tempsDepuisDebut = (maintenant.getTime() - new Date(etape.tempsReel.dateDebut).getTime()) / (1000 * 60);
            tempsTotal += tempsDepuisDebut;
        }

        return tempsTotal;
    };

    const formaterDuree = (minutes: number) => {
        if (minutes < 60) {
            return `${Math.round(minutes)}min`;
        } else if (minutes < 60 * 24) {
            const heures = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            return mins > 0 ? `${heures}h${mins}` : `${heures}h`;
        } else {
            const jours = Math.floor(minutes / (60 * 24));
            const heures = Math.floor((minutes % (60 * 24)) / 60);
            return heures > 0 ? `${jours}j ${heures}h` : `${jours}j`;
        }
    };

    const calculerEcartTemps = (etape: any) => {
        const tempsReel = calculerTempsReel(etape);
        const tempsEstime = etape.heuresEstimees * 60; // convertir en minutes
        const ecart = tempsReel - tempsEstime;
        const pourcentage = tempsEstime > 0 ? Math.round((ecart / tempsEstime) * 100) : 0;

        return {
            ecartMinutes: ecart,
            ecartPourcentage: pourcentage,
            enAvance: ecart < 0,
            enRetard: ecart > 0
        };
    };

    // Fonctions de mise à jour directe des champs
    const modifierNomProjet = (nouveauNom: string) => {
        const projetMisAJour = { ...projet, nom: nouveauNom };
        onUpdateProjet(projetMisAJour);
    };

    const modifierDescriptionProjet = (nouvelleDescription: string) => {
        const projetMisAJour = { ...projet, description: nouvelleDescription };
        onUpdateProjet(projetMisAJour);
    };

    const modifierDateCommande = (nouvelleDate: string) => {
        const projetMisAJour = { ...projet, dateCommande: new Date(nouvelleDate) };
        onUpdateProjet(projetMisAJour);
    };

    const modifierDateVoulue = (nouvelleDate: string) => {
        const projetMisAJour = { ...projet, dateVoulue: new Date(nouvelleDate) };
        onUpdateProjet(projetMisAJour);
    };

    const modifierQuantite = (nouvelleQuantite: number) => {
        const projetMisAJour = { ...projet, quantite: nouvelleQuantite };
        onUpdateProjet(projetMisAJour);
    };

    const changerStatutEtape = (etapeId: string, nouveauStatut: StatutTache) => {
        const maintenant = new Date();

        const nouvellesEtapes = projet.etapes.map(etape => {
            if (etape.id === etapeId) {
                const ancienStatut = etape.statut;

                // Créer l'entrée d'historique
                const changement: ChangementStatut = {
                    id: `${Date.now()}-${Math.random()}`,
                    ancienStatut,
                    nouveauStatut,
                    dateChangement: maintenant,
                    commentaire: `Changement de ${ancienStatut} vers ${nouveauStatut}`
                };

                // Initialiser l'historique si nécessaire
                const historiqueExistant = etape.historiqueStatuts || [];

                // Calculer le temps réel
                let tempsReel = etape.tempsReel || {
                    tempsTotal: 0,
                    tempsPause: 0,
                    nbPauses: 0
                };

                // Logique de calcul du temps selon les transitions de statut
                if (ancienStatut === 'en_attente' && nouveauStatut === 'en_cours') {
                    // Démarrage de l'étape
                    tempsReel.dateDebut = maintenant;
                } else if (ancienStatut === 'en_cours' && nouveauStatut === 'termine') {
                    // Fin de l'étape
                    tempsReel.dateFin = maintenant;
                    if (tempsReel.dateDebut) {
                        const tempsEcoule = (maintenant.getTime() - tempsReel.dateDebut.getTime()) / (1000 * 60); // en minutes
                        tempsReel.tempsTotal += tempsEcoule - tempsReel.tempsPause;
                    }
                } else if (ancienStatut === 'en_cours' && (nouveauStatut === 'bloque' || nouveauStatut === 'en_attente')) {
                    // Mise en pause
                    tempsReel.nbPauses++;
                } else if ((ancienStatut === 'bloque' || ancienStatut === 'en_attente') && nouveauStatut === 'en_cours') {
                    // Reprise après pause
                }

                return {
                    ...etape,
                    statut: nouveauStatut,
                    historiqueStatuts: [...historiqueExistant, changement],
                    tempsReel,
                    dateCreation: etape.dateCreation || maintenant
                };
            }
            return etape;
        });

        const projetMisAJour = { ...projet, etapes: nouvellesEtapes };
        onUpdateProjet(projetMisAJour);
    };

    const modifierHeuresEtape = (etapeId: string, nouvellesHeures: number) => {
        const nouvellesEtapes = projet.etapes.map(etape => {
            if (etape.id === etapeId) {
                return { ...etape, heuresEstimees: nouvellesHeures };
            }
            return etape;
        });

        const projetMisAJour = { ...projet, etapes: nouvellesEtapes };
        onUpdateProjet(projetMisAJour);
    };



    const progression = calculerProgression();
    const heuresRestantes = calculerHeuresRestantes();
    const heuresTerminees = calculerHeuresTerminees();
    const heuresTotal = heuresRestantes + heuresTerminees;

    return (
        <div className="detail-projet">
            <div className="detail-header">
                <button onClick={onRetour} className="btn-retour">
                    ← Retour aux projets
                </button>

                <div className="projet-info">
                    <input
                        type="text"
                        value={projet.nom}
                        onChange={(e) => modifierNomProjet(e.target.value)}
                        className="nom-projet-editable"
                        placeholder="Nom du projet"
                    />

                    <textarea
                        value={projet.description}
                        onChange={(e) => modifierDescriptionProjet(e.target.value)}
                        className="description-editable"
                        placeholder="Description du projet"
                        rows={2}
                    />

                    <div className="stats-projet">
                        <div className="stat">
                            <span className="label">Progression</span>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progression}%` }}
                                ></div>
                                <span className="progress-text">{progression}%</span>
                            </div>
                        </div>

                        <div className="stat">
                            <span className="label">Quantité</span>
                            <input
                                type="number"
                                value={projet.quantite}
                                onChange={(e) => modifierQuantite(parseInt(e.target.value) || 1)}
                                className="quantite-editable"
                                min="1"
                            />
                        </div>

                        <div className="stat">
                            <span className="label">Date commande</span>
                            <input
                                type="date"
                                value={projet.dateCommande.toISOString().split('T')[0]}
                                onChange={(e) => modifierDateCommande(e.target.value)}
                                className="date-editable"
                            />
                        </div>

                        <div className="stat">
                            <span className="label">Date voulue</span>
                            <input
                                type="date"
                                value={projet.dateVoulue.toISOString().split('T')[0]}
                                onChange={(e) => modifierDateVoulue(e.target.value)}
                                className="date-editable"
                            />
                        </div>

                        <div className="stat">
                            <span className="label">Heures restantes</span>
                            <span className="valeur heures-restantes">{heuresRestantes}h</span>
                        </div>

                        <div className="stat">
                            <span className="label">Heures terminées</span>
                            <span className="valeur heures-terminees">{heuresTerminees}h</span>
                        </div>

                        <div className="stat">
                            <span className="label">Total</span>
                            <span className="valeur">{heuresTotal}h</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="etapes-liste">
                <h2>Étapes de production</h2>

                {projet.etapes.map((etape, index) => {
                    const estBloque = etape.dependances && etape.dependances.some(depId => {
                        const etapeDep = projet.etapes.find(e => e.id === depId);
                        return etapeDep && etapeDep.statut !== 'termine';
                    });

                    return (
                        <div key={etape.id} className={`etape-card ${estBloque ? 'bloque' : ''}`}>
                            <div className="etape-numero">{index + 1}</div>

                            <div className="etape-contenu">
                                <h3>{LABELS_ETAPES[etape.etape]}</h3>

                                <div className="etape-details">
                                    <div className="detail-item">
                                        <span className="label">Statut :</span>
                                        <select
                                            value={etape.statut}
                                            onChange={(e) => changerStatutEtape(etape.id, e.target.value as StatutTache)}
                                            className="select-statut"
                                            style={{ backgroundColor: COULEURS_STATUT[etape.statut] + '20', color: COULEURS_STATUT[etape.statut] }}
                                            disabled={estBloque && etape.statut === 'en_attente'}
                                        >
                                            <option value="en_attente">En attente</option>
                                            <option value="en_cours">En cours</option>
                                            <option value="termine">Terminé</option>
                                            <option value="bloque">Bloqué</option>
                                        </select>
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">Heures estimées :</span>
                                        <input
                                            type="number"
                                            value={etape.heuresEstimees}
                                            onChange={(e) => modifierHeuresEtape(etape.id, parseInt(e.target.value) || 0)}
                                            className="input-heures"
                                            min="0"
                                        />
                                    </div>

                                    {/* Nouveau : Affichage des temps réels */}
                                    <div className="detail-item temps-reel">
                                        <span className="label">Temps réel :</span>
                                        <div className="temps-info">
                                            {etape.tempsReel && calculerTempsReel(etape) > 0 ? (
                                                <>
                                                    <span className="temps-passe">
                                                        {formaterDuree(calculerTempsReel(etape))}
                                                    </span>
                                                    {etape.statut === 'termine' && (
                                                        <span className={`ecart ${calculerEcartTemps(etape).enRetard ? 'retard' : calculerEcartTemps(etape).enAvance ? 'avance' : 'ok'}`}>
                                                            ({calculerEcartTemps(etape).ecartPourcentage > 0 ? '+' : ''}{calculerEcartTemps(etape).ecartPourcentage}%)
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="pas-commence">Pas encore commencé</span>
                                            )}
                                        </div>
                                        {etape.tempsReel?.nbPauses && etape.tempsReel.nbPauses > 0 && (
                                            <div className="info-pauses">
                                                {etape.tempsReel.nbPauses} pause{etape.tempsReel.nbPauses > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-item">
                                        <span className="label">Compétences requises :</span>
                                        <span className="competences">
                                            {etape.competenceRequise.length > 0 ? etape.competenceRequise.join(', ') : 'Processus externe'}
                                        </span>
                                    </div>

                                    {etape.dependances && etape.dependances.length > 0 && (
                                        <div className="detail-item">
                                            <span className="label">Dépend de :</span>
                                            <span className="dependances">
                                                {etape.dependances.map(depId => {
                                                    const etapeDep = projet.etapes.find(e => e.id === depId);
                                                    return etapeDep ? LABELS_ETAPES[etapeDep.etape] : depId;
                                                }).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="etape-status-indicator"
                                style={{ backgroundColor: COULEURS_STATUT[etape.statut] }}>
                            </div>
                        </div>
                    );
                })}
            </div>


        </div>
    );
}
