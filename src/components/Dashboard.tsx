import { useMemo, useState } from 'react';
import { Employe, Projet, Competence, Alerte, StatutTache, EstimationEtape } from '../types';
import PlanificationAchats from './PlanificationAchats';
import WorkloadForecast from './WorkloadForecast';
import EtatAtelier from './EtatAtelier';

interface Props {
    employes: Employe[];
    projets: Projet[];
    setProjets: (projets: Projet[]) => void;
}

interface ChargeCompetence {
    competence: Competence;
    label: string;
    employesDisponibles: number;
    heuresDisponibles: number;
    heuresNecessaires: number;
    utilisation: number;
    surcharge: boolean;
}

// 🆕 Types pour les tâches connexes
interface TacheConnexe {
    id: string;
    nom: string;
    description: string;
    employeAffecte?: string;
    statut: 'en_attente' | 'en_cours' | 'termine';
    dateCreation: Date;
}

// 🆕 Types pour les alarmes d'affectation
interface AlarmeAffectation {
    employeId: string;
    employeNom: string;
    raison: string;
}

const COMPETENCES_LABELS: Record<Competence, string> = {
    'soudage': '🔥 Soudage',
    'assemblage': '🔧 Assemblage',
    'electrique': '⚡ Électrique',
    'machinage': '🏭 Machinage',
    'coupe_materiel': '✂️ Coupe matériel',
    'test_qualite': '🧪 Test qualité',
    'test_logiciel': '💻 Test logiciel',
    'achat': '💰 Achat'
};

export default function Dashboard({ employes, projets, setProjets }: Props) {
    // 🆕 État pour les tâches connexes et alarmes
    const [tachesConnexes, setTachesConnexes] = useState<TacheConnexe[]>(() => {
        const saved = localStorage.getItem('taches-connexes');
        return saved ? JSON.parse(saved) : [];
    });

    const [alarmes, setAlarmes] = useState<AlarmeAffectation[]>([]);
    const [montrerAlarmes, setMontrerAlarmes] = useState(false);
    const [nouvelleTacheConnexe, setNouvelleTacheConnexe] = useState('');
    const [nouvelleTacheDescription, setNouvelleTacheDescription] = useState('');
    const [montrerDetailsCharge, setMontrerDetailsCharge] = useState(false);

    // Fonction pour sauvegarder les tâches connexes
    const sauvegarderTachesConnexes = (taches: TacheConnexe[]) => {
        setTachesConnexes(taches);
        localStorage.setItem('taches-connexes', JSON.stringify(taches));
    };

    // Fonction pour ajouter une tâche connexe
    const ajouterTacheConnexe = () => {
        if (nouvelleTacheConnexe.trim()) {
            const nouvelleTache: TacheConnexe = {
                id: Date.now().toString(),
                nom: nouvelleTacheConnexe,
                description: nouvelleTacheDescription,
                statut: 'en_attente',
                dateCreation: new Date()
            };

            sauvegarderTachesConnexes([...tachesConnexes, nouvelleTache]);
            setNouvelleTacheConnexe('');
            setNouvelleTacheDescription('');
        }
    };

    // Fonction pour calculer la charge actuelle d'un employé
    const calculerChargeEmploye = (employeId: string): number => {
        return projetsActifs.reduce((total, projet) => {
            const etapesAssignees = projet.etapes.filter(etape =>
                etape.employeAffecte === employeId &&
                etape.statut !== 'termine'
            );
            return total + etapesAssignees.reduce((sum, etape) => sum + etape.heuresEstimees, 0);
        }, 0);
    };

    // 🆕 Fonction pour trouver le meilleur employé avec priorités spéciales
    const trouverMeilleurEmployeAvecPriorites = (competencesRequises: Competence[]): string | null => {
        if (competencesRequises.length === 0) return null;

        // Trouver tous les employés compétents
        const employesCompetents = employes.filter(emp =>
            competencesRequises.every((comp: Competence) => emp.competences.includes(comp))
        );

        if (employesCompetents.length === 0) return null;

        // 🎯 PRIORITÉS SPÉCIALES :

        // 1. Pour l'électrique, Dominic est prioritaire
        if (competencesRequises.includes('electrique')) {
            const dominic = employesCompetents.find(emp => emp.nom.toLowerCase().includes('dominic'));
            if (dominic) {
                const tacheDominic = obtenirTacheActuelleEmploye(dominic.id);
                // Si Dominic est libre, le prioriser
                if (!tacheDominic) {
                    return dominic.id;
                }
            }
        }

        // 2. Pour les achats, Mario est prioritaire (avec Bob en binôme)
        if (competencesRequises.includes('achat')) {
            const mario = employesCompetents.find(emp => emp.nom.toLowerCase().includes('mario'));
            if (mario) {
                const tacheMario = obtenirTacheActuelleEmploye(mario.id);
                // Si Mario est libre, le prioriser
                if (!tacheMario) {
                    return mario.id;
                }
            }
        }

        // 3. Sinon, prendre l'employé le moins chargé parmi les compétents
        const employesTries = employesCompetents
            .map(emp => ({
                ...emp,
                tacheActuelle: obtenirTacheActuelleEmploye(emp.id),
                estLibre: !obtenirTacheActuelleEmploye(emp.id)
            }))
            // Trier : libres d'abord, puis par priorité spéciale
            .sort((a, b) => {
                // Les libres en premier
                if (a.estLibre && !b.estLibre) return -1;
                if (!a.estLibre && b.estLibre) return 1;

                // Si pour l'électrique et Dominic disponible, le prioriser
                if (competencesRequises.includes('electrique')) {
                    if (a.nom.toLowerCase().includes('dominic') && a.estLibre) return -1;
                    if (b.nom.toLowerCase().includes('dominic') && b.estLibre) return 1;
                }

                // Si pour les achats et Mario disponible, le prioriser
                if (competencesRequises.includes('achat')) {
                    if (a.nom.toLowerCase().includes('mario') && a.estLibre) return -1;
                    if (b.nom.toLowerCase().includes('mario') && b.estLibre) return 1;
                }

                return 0; // Sinon ordre normal
            });

        // Retourner le premier libre, ou null si tous occupés
        const employeLibre = employesTries.find(emp => emp.estLibre);
        return employeLibre ? employeLibre.id : null;
    };

    // 🆕 Fonction pour affecter Bob automatiquement avec Mario sur les achats
    const affecterBobAvecMario = () => {
        const mario = employes.find(emp => emp.nom.toLowerCase().includes('mario'));
        const bob = employes.find(emp => emp.nom.toLowerCase().includes('bob'));

        if (!mario || !bob) return;

        const tacheMario = obtenirTacheActuelleEmploye(mario.id);

        // Si Mario travaille sur un achat, affecter Bob à la même tâche
        if (tacheMario && tacheMario.etape === 'achat') {
            const tacheBob = obtenirTacheActuelleEmploye(bob.id);

            // Si Bob n'est pas déjà sur la même tâche que Mario
            if (!tacheBob || tacheBob.etapeId !== tacheMario.etapeId) {
                // Libérer Bob de sa tâche actuelle
                if (tacheBob) {
                    libererEmploye(bob.id);
                }
                // L'affecter à la même tâche que Mario
                assignerEmployeExclusif(tacheMario.projetId, tacheMario.etapeId, bob.id);
            }
        }
    };

    // 🆕 Fonction pour obtenir la tâche actuelle de chaque employé
    const obtenirTacheActuelleEmploye = (employeId: string) => {
        for (const projet of projetsActifs) {
            for (const etape of projet.etapes) {
                if (etape.employeAffecte === employeId && etape.statut === 'en_cours') {
                    return {
                        projet: projet.nom,
                        etape: etape.etape,
                        statut: etape.statut,
                        heures: etape.heuresEstimees,
                        projetId: projet.id,
                        etapeId: etape.id
                    };
                }
            }
        }
        return null;
    };

    // 🆕 Fonction pour libérer un employé de sa tâche actuelle
    const libererEmploye = (employeId: string) => {
        const nouveauxProjets = projets.map(projet => {
            const nouvellesEtapes = projet.etapes.map(etape => {
                if (etape.employeAffecte === employeId && etape.statut === 'en_cours') {
                    return { ...etape, statut: 'en_attente' as const, employeAffecte: undefined };
                }
                return etape;
            });
            return { ...projet, etapes: nouvellesEtapes };
        });
        setProjets(nouveauxProjets);
    };

    // 🆕 Fonction pour assigner un employé à une tâche (en libérant sa tâche actuelle)
    const assignerEmployeExclusif = (projetId: string, etapeId: string, employeId: string) => {
        // D'abord libérer l'employé de sa tâche actuelle
        libererEmploye(employeId);

        // Puis l'assigner à la nouvelle tâche
        const nouveauxProjets = projets.map(projet => {
            if (projet.id === projetId) {
                const nouvellesEtapes = projet.etapes.map(etape => {
                    if (etape.id === etapeId) {
                        return {
                            ...etape,
                            employeAffecte: employeId,
                            statut: 'en_cours' as const
                        };
                    }
                    return etape;
                });
                return { ...projet, etapes: nouvellesEtapes };
            }
            return projet;
        });
        setProjets(nouveauxProjets);
    };

    // Fonction pour nettoyer les affectations incorrectes
    const nettoyerAffectationsIncorrectes = () => {
        const nouveauxProjets = projets.map(projet => {
            const nouvellesEtapes = projet.etapes.map(etape => {
                // Si un employé est affecté mais n'a pas toutes les compétences requises
                if (etape.employeAffecte && etape.competenceRequise.length > 0) {
                    const employe = employes.find(emp => emp.id === etape.employeAffecte);
                    if (employe && !etape.competenceRequise.every((comp: Competence) => employe.competences.includes(comp))) {
                        // Retirer l'affectation incorrecte
                        return { ...etape, employeAffecte: undefined };
                    }
                }
                return etape;
            });
            return { ...projet, etapes: nouvellesEtapes };
        });
        setProjets(nouveauxProjets);
    };

    // Fonction modifiée pour affecter automatiquement (une tâche par employé)
    const affecterEmployesAutomatiquement = () => {
        // D'abord nettoyer les mauvaises affectations
        nettoyerAffectationsIncorrectes();

        // Libérer tous les employés
        employes.forEach(emp => libererEmploye(emp.id));

        // 🆕 Réinitialiser les alarmes
        const nouvellesAlarmes: AlarmeAffectation[] = [];

        // Trouver toutes les tâches en attente
        const tachesEnAttente: Array<{ projet: Projet, etape: EstimationEtape }> = [];

        projetsActifs.forEach(projet => {
            projet.etapes.forEach(etape => {
                if (etape.statut === 'en_attente' && etape.heuresEstimees > 0) {
                    tachesEnAttente.push({ projet, etape });
                }
            });
        });

        // Trier par priorité du projet
        const prioriteOrdre = { 'urgente': 4, 'haute': 3, 'normale': 2, 'basse': 1 };
        tachesEnAttente.sort((a, b) => prioriteOrdre[b.projet.priorite] - prioriteOrdre[a.projet.priorite]);

        // Assigner les tâches selon les priorités et disponibilités
        tachesEnAttente.forEach(({ projet, etape }) => {
            const meilleurEmploye = trouverMeilleurEmployeAvecPriorites(etape.competenceRequise);

            if (meilleurEmploye) {
                assignerEmployeExclusif(projet.id, etape.id, meilleurEmploye);
            } else {
                // 🆕 Aucun employé disponible - créer une alarme
                nouvellesAlarmes.push({
                    employeId: 'none',
                    employeNom: `Tâche: ${etape.etape} (${projet.nom})`,
                    raison: `Compétence requise: ${etape.competenceRequise} - Aucun employé avec cette compétence disponible`
                });
            }
        });

        // 🆕 Après affectation, s'assurer que Bob travaille avec Mario sur les achats
        affecterBobAvecMario();

        // 🆕 Vérifier quels employés n'ont pas de tâches affectées
        const employesSansAffectation: string[] = [];
        employes.forEach(employe => {
            const aUneTache = projetsActifs.some(projet =>
                projet.etapes.some(etape => etape.employeAffecte === employe.nom)
            );

            const tacheConnexeActuelle = tachesConnexes.find(t =>
                t.employeAffecte === employe.nom && t.statut === 'en_cours'
            );

            if (!aUneTache && !tacheConnexeActuelle) {
                employesSansAffectation.push(employe.nom);
            }
        });

        // 🆕 Créer des alarmes pour les employés sans affectation
        employesSansAffectation.forEach(nomEmploye => {
            nouvellesAlarmes.push({
                employeId: nomEmploye,
                employeNom: nomEmploye,
                raison: 'Aucune tâche de projet disponible - peut être affecté à une tâche connexe'
            });
        });

        // 🆕 Mettre à jour les alarmes
        setAlarmes(nouvellesAlarmes);

        // 🆕 Afficher automatiquement les alarmes s'il y en a
        if (nouvellesAlarmes.length > 0) {
            setMontrerAlarmes(true);
        }
    };

    // Fonction pour mettre à jour le statut d'une étape
    const changerStatutEtape = (projetId: string, etapeId: string, nouveauStatut: StatutTache) => {
        const nouveauxProjets = projets.map(projet => {
            if (projet.id === projetId) {
                const nouvellesEtapes = projet.etapes.map(etape => {
                    if (etape.id === etapeId) {
                        return { ...etape, statut: nouveauStatut };
                    }
                    return etape;
                });
                return { ...projet, etapes: nouvellesEtapes };
            }
            return projet;
        });
        setProjets(nouveauxProjets);
    };

    // Fonction pour changer l'affectation d'un employé
    const changerAffectationEtape = (projetId: string, etapeId: string, nouvelEmployeId: string | null) => {
        const nouveauxProjets = projets.map(projet => {
            if (projet.id === projetId) {
                const nouvellesEtapes = projet.etapes.map(etape => {
                    if (etape.id === etapeId) {
                        return { ...etape, employeAffecte: nouvelEmployeId || undefined };
                    }
                    return etape;
                });
                return { ...projet, etapes: nouvellesEtapes };
            }
            return projet;
        });
        setProjets(nouveauxProjets);
    };

    // 🆕 Fonctions pour gérer les tâches connexes
    const affecterEmployeATacheConnexe = (tacheId: string, employeNom: string) => {
        const nouvellesTaches = tachesConnexes.map(tache =>
            tache.id === tacheId
                ? { ...tache, employeAffecte: employeNom, statut: 'en_cours' as const }
                : tache
        );
        sauvegarderTachesConnexes(nouvellesTaches);
    };

    const changerStatutTacheConnexe = (tacheId: string, nouveauStatut: 'en_attente' | 'en_cours' | 'termine') => {
        const nouvellesTaches = tachesConnexes.map(tache =>
            tache.id === tacheId
                ? { ...tache, statut: nouveauStatut }
                : tache
        );
        sauvegarderTachesConnexes(nouvellesTaches);
    };

    const supprimerTacheConnexe = (tacheId: string) => {
        const nouvellesTaches = tachesConnexes.filter(tache => tache.id !== tacheId);
        sauvegarderTachesConnexes(nouvellesTaches);
    };

    // Fermer les alarmes
    const fermerAlarmes = () => {
        setMontrerAlarmes(false);
        setAlarmes([]);
    };

    const projetsActifs = useMemo(() => {
        return projets.filter(projet => {
            // Si le projet est explicitement marqué comme terminé, l'exclure
            if (projet.statut === 'termine') return false;

            // Vérifier si toutes les étapes avec des heures sont terminées
            const etapesAvecHeures = projet.etapes.filter(etape => etape.heuresEstimees > 0);
            const etapesTerminees = etapesAvecHeures.filter(etape => etape.statut === 'termine');

            // Si toutes les étapes avec heures sont terminées, considérer le projet comme terminé
            if (etapesAvecHeures.length > 0 && etapesTerminees.length === etapesAvecHeures.length) {
                return false;
            }

            return true;
        });
    }, [projets]);

    const analysePlanification = useMemo((): {
        charges: ChargeCompetence[],
        alertes: Alerte[],
        totalProjetsFutures: number,
        totalHeuresFutures: number
    } => {

        const alertes: Alerte[] = [];
        const charges: ChargeCompetence[] = [];

        // Analyser chaque compétence
        Object.entries(COMPETENCES_LABELS).forEach(([competence, label]) => {
            const comp = competence as Competence;

            // Calculer les employés disponibles pour cette compétence
            const employesCompetents = employes.filter(emp => emp.competences.includes(comp));
            const employesDisponibles = employesCompetents.length;
            const heuresDisponibles = employesCompetents.reduce((total, emp) => total + emp.heuresParSemaine, 0);

            // Calculer les heures nécessaires SEULEMENT pour les projets réellement actifs
            const heuresNecessaires = projetsActifs
                .reduce((total, projet) => {
                    const etapesCompetence = projet.etapes.filter(etape =>
                        etape.competenceRequise.includes(comp) &&
                        etape.heuresEstimees > 0 &&
                        etape.statut !== 'termine' // ✅ NE PAS compter les étapes terminées !
                    );
                    const heuresProjet = etapesCompetence.reduce((sum, etape) => sum + etape.heuresEstimees, 0);
                    return total + (heuresProjet * projet.quantite);
                }, 0);

            const utilisation = heuresDisponibles > 0 ? (heuresNecessaires / heuresDisponibles) * 100 : 0;
            const surcharge = utilisation > 100;

            charges.push({
                competence: comp,
                label,
                employesDisponibles,
                heuresDisponibles,
                heuresNecessaires,
                utilisation,
                surcharge
            });

            // Générer des alertes
            if (employesDisponibles === 0 && heuresNecessaires > 0) {
                alertes.push({
                    id: `manque-${comp}-${Date.now()}`,
                    type: 'manque_personnel',
                    gravite: 'critique',
                    message: `Aucun employé compétent en ${label.toLowerCase()} disponible, mais ${Math.ceil(heuresNecessaires)}h de travail nécessaire`,
                    dateCreation: new Date(),
                    resolu: false
                });
            } else if (surcharge) {
                alertes.push({
                    id: `surcharge-${comp}-${Date.now()}`,
                    type: 'surcharge',
                    gravite: utilisation > 150 ? 'critique' : 'attention',
                    message: `Surcharge détectée en ${label.toLowerCase()}: ${Math.ceil(utilisation)}% de la capacité requise`,
                    dateCreation: new Date(),
                    resolu: false
                });
            }
        });

        // Compter les projets avec du travail restant (pas complètement terminés)
        const totalProjetsFutures = projetsActifs.length;
        const totalHeuresFutures = projetsActifs
            .reduce((total, projet) => {
                // ✅ Ne compter que les heures des étapes NON terminées
                const heuresProjet = projet.etapes
                    .filter(etape => etape.statut !== 'termine')
                    .reduce((sum, etape) => sum + etape.heuresEstimees, 0);
                return total + (heuresProjet * projet.quantite);
            }, 0);

        return { charges, alertes, totalProjetsFutures, totalHeuresFutures };
    }, [employes, projetsActifs]);

    const projetsUrgents = projetsActifs.filter(p => p.priorite === 'urgente');
    const projetsRetard = projetsActifs.filter(p => {
        return new Date(p.dateVoulue) < new Date();
    });

    return (
        <div className="dashboard">
            {/* 🏭 État de l'Atelier - Vue Simple */}
            <EtatAtelier projets={projets} employes={employes} />

            {/* 🛒 Section Planification des Achats */}
            <PlanificationAchats projets={projets} setProjets={setProjets} />

            {/* 📈 Visualisation de charge future */}
            <WorkloadForecast projets={projets} employes={employes} />

            {/* 🆕 Bouton d'affectation automatique */}
            <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#e8f4f8',
                border: '1px solid #3498db',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>🤖 Affectation automatique intelligente</h4>
                <p style={{ margin: '0 0 15px 0', color: '#7f8c8d', fontSize: '14px' }}>
                    L'IA va affecter automatiquement vos employés aux tâches selon leurs compétences et priorités spéciales.
                    <br />
                    <strong>⚡ Dominic sera priorisé pour toutes les tâches électriques.</strong>
                    <br />
                    <strong>💰 Mario sera priorisé pour les achats, avec Bob comme binôme.</strong>
                </p>
                <button
                    onClick={affecterEmployesAutomatiquement}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px'
                    }}
                >
                    🚀 Affecter automatiquement les employés
                </button>
                <button
                    onClick={nettoyerAffectationsIncorrectes}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                >
                    🧹 Nettoyer les affectations incorrectes
                </button>
            </div>

            {/* 🆕 Alarmes d'affectation */}
            {alarmes.length > 0 && montrerAlarmes && (
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#ffeaa7',
                    border: '2px solid #fdcb6e',
                    borderRadius: '8px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: '0', color: '#d63031' }}>⚠️ Alarmes d'affectation ({alarmes.length})</h4>
                        <button
                            onClick={fermerAlarmes}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#d63031',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            ✕ Fermer
                        </button>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        {alarmes.map((alarme, index) => (
                            <div key={index} style={{
                                padding: '10px',
                                marginBottom: '8px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #ddd'
                            }}>
                                <strong>{alarme.employeNom}</strong>
                                <br />
                                <small style={{ color: '#666' }}>{alarme.raison}</small>

                                {/* Si c'est un employé sans affectation, proposer des tâches connexes */}
                                {alarme.employeId !== 'none' && (
                                    <div style={{ marginTop: '8px' }}>
                                        <small style={{ color: '#2d3436', fontWeight: 'bold' }}>
                                            💡 Tâches connexes disponibles :
                                        </small>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            {tachesConnexes
                                                .filter(t => t.statut === 'en_attente')
                                                .slice(0, 3)
                                                .map(tache => (
                                                    <button
                                                        key={tache.id}
                                                        onClick={() => affecterEmployeATacheConnexe(tache.id, alarme.employeNom)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: '#00b894',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '11px'
                                                        }}
                                                    >
                                                        {tache.nom}
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🆕 Gestion des tâches connexes */}
            <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px'
            }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>🔧 Tâches connexes (hors projets)</h4>

                {/* Ajouter nouvelle tâche connexe */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Nom de la tâche"
                        value={nouvelleTacheConnexe}
                        onChange={(e) => setNouvelleTacheConnexe(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Description (optionnel)"
                        value={nouvelleTacheDescription}
                        onChange={(e) => setNouvelleTacheDescription(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    <button
                        onClick={ajouterTacheConnexe}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ➕ Ajouter
                    </button>
                </div>

                {/* Liste des tâches connexes */}
                {tachesConnexes.length > 0 && (
                    <div>
                        <h5 style={{ marginBottom: '10px', color: '#6c757d' }}>Tâches actuelles :</h5>
                        {tachesConnexes.map(tache => (
                            <div key={tache.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px',
                                marginBottom: '8px',
                                backgroundColor: 'white',
                                borderRadius: '6px',
                                border: '1px solid #dee2e6'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <strong>{tache.nom}</strong>
                                    {tache.description && <div style={{ fontSize: '12px', color: '#666' }}>{tache.description}</div>}
                                    {tache.employeAffecte && (
                                        <div style={{ fontSize: '12px', color: '#007bff' }}>
                                            👤 Affecté à : {tache.employeAffecte}
                                        </div>
                                    )}
                                </div>

                                <select
                                    value={tache.statut}
                                    onChange={(e) => changerStatutTacheConnexe(tache.id, e.target.value as any)}
                                    style={{
                                        padding: '4px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc'
                                    }}
                                >
                                    <option value="en_attente">⏳ En attente</option>
                                    <option value="en_cours">🚧 En cours</option>
                                    <option value="termine">✅ Terminé</option>
                                </select>

                                <button
                                    onClick={() => supprimerTacheConnexe(tache.id)}
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <h2>📊 Tableau de bord - Vue d'ensemble</h2>

                {/* Résumé général */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                    <div className="stat-card" style={{
                        padding: '15px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '8px',
                        border: '1px solid #c3e6cb'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{employes.length}</div>
                        <div style={{ color: '#155724' }}>👥 Employés actifs</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: '15px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '8px',
                        border: '1px solid #bbdefb'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0d47a1' }}>{projets.length}</div>
                        <div style={{ color: '#0d47a1' }}>📋 Projets totaux</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: '15px',
                        backgroundColor: '#fff3e0',
                        borderRadius: '8px',
                        border: '1px solid #ffcc02'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>{analysePlanification.totalProjetsFutures}</div>
                        <div style={{ color: '#e65100' }}>⏳ Projets en attente</div>
                    </div>

                    <div className="stat-card" style={{
                        padding: '15px',
                        backgroundColor: '#fce4ec',
                        borderRadius: '8px',
                        border: '1px solid #f8bbd9'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#880e4f' }}>
                            {Math.ceil(analysePlanification.totalHeuresFutures / 40)}
                        </div>
                        <div style={{ color: '#880e4f' }}>📅 Semaines de travail</div>
                    </div>
                </div>

                {/* Alertes */}
                {analysePlanification.alertes.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3>🚨 Alertes importantes</h3>
                        {analysePlanification.alertes.map(alerte => (
                            <div key={alerte.id} className={`alert alert-${alerte.gravite === 'critique' ? 'danger' :
                                alerte.gravite === 'attention' ? 'warning' : 'info'
                                }`}>
                                {alerte.gravite === 'critique' ? '🚨' : '⚠️'} {alerte.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* Projets urgents */}
                {projetsUrgents.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3>🚨 Projets urgents</h3>
                        {projetsUrgents.map(projet => (
                            <div key={projet.id} className="alert alert-danger">
                                <strong>{projet.nom}</strong> - Livraison: {projet.dateVoulue.toLocaleDateString('fr-CA')}
                            </div>
                        ))}
                    </div>
                )}

                {/* Projets en retard */}
                {projetsRetard.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <h3>⏰ Projets en retard</h3>
                        {projetsRetard.map(projet => (
                            <div key={projet.id} className="alert alert-warning">
                                <strong>{projet.nom}</strong> - Devait être livré le {projet.dateVoulue.toLocaleDateString('fr-CA')}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🆕 Tableau de bord des employés - Qui fait quoi */}
            <div className="card">
                <h3>👥 Tableau de bord des employés - Qui fait quoi maintenant</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                    {employes.map(employe => {
                        const tacheActuelle = obtenirTacheActuelleEmploye(employe.id);
                        const estDominic = employe.nom.toLowerCase().includes('dominic');
                        const estMario = employe.nom.toLowerCase().includes('mario');
                        const estBob = employe.nom.toLowerCase().includes('bob');
                        const estExpertElectrique = estDominic && employe.competences.includes('electrique');
                        const estExpertAchat = estMario && employe.competences.includes('achat');
                        const estBinomeAchat = estBob && employe.competences.includes('achat');

                        return (
                            <div key={employe.id} style={{
                                padding: '15px',
                                border: `2px solid ${tacheActuelle ? '#27ae60' : '#95a5a6'}`,
                                borderRadius: '8px',
                                backgroundColor: tacheActuelle ? '#f8fff8' : '#f8f9fa',
                                position: 'relative'
                            }}>
                                {/* 🔹 Badges spéciaux */}
                                {estExpertElectrique && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        backgroundColor: '#f39c12',
                                        color: 'white',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        ⚡ EXPERT ÉLECTRIQUE
                                    </div>
                                )}
                                {estExpertAchat && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        backgroundColor: '#9b59b6',
                                        color: 'white',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        💰 ACHETEUR PRINCIPAL
                                    </div>
                                )}
                                {estBinomeAchat && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        backgroundColor: '#8e44ad',
                                        color: 'white',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        🤝 BINÔME ACHAT
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingRight: (estExpertElectrique || estExpertAchat || estBinomeAchat) ? '140px' : '0' }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50' }}>
                                        {estDominic ? '👑 ' : ''}
                                        {estMario ? '💰 ' : ''}
                                        {estBob ? '🤝 ' : ''}
                                        {employe.nom}
                                    </h4>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        backgroundColor: tacheActuelle ? '#27ae60' : '#95a5a6'
                                    }}>
                                        {tacheActuelle ? '🔄 Occupé' : '💤 Disponible'}
                                    </span>
                                </div>

                                {tacheActuelle ? (
                                    <div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>📋 Projet:</strong> {tacheActuelle.projet}
                                        </div>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>⚙️ Tâche:</strong> {tacheActuelle.etape} ({tacheActuelle.heures}h)
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                            <button
                                                onClick={() => changerStatutEtape(tacheActuelle.projetId, tacheActuelle.etapeId, 'termine')}
                                                style={{
                                                    padding: '5px 10px',
                                                    fontSize: '11px',
                                                    backgroundColor: '#27ae60',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✅ Terminé
                                            </button>
                                            <button
                                                onClick={() => changerStatutEtape(tacheActuelle.projetId, tacheActuelle.etapeId, 'bloque')}
                                                style={{
                                                    padding: '5px 10px',
                                                    fontSize: '11px',
                                                    backgroundColor: '#e74c3c',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🚫 Bloqué
                                            </button>
                                            <button
                                                onClick={() => libererEmploye(employe.id)}
                                                style={{
                                                    padding: '5px 10px',
                                                    fontSize: '11px',
                                                    backgroundColor: '#f39c12',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🔄 Libérer
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '10px' }}>
                                            En attente d'affectation
                                        </div>
                                        <div style={{ fontSize: '12px' }}>
                                            <strong>🛠️ Compétences:</strong>
                                            <div style={{ marginTop: '5px' }}>
                                                {employe.competences.map(comp => (
                                                    <span key={comp} style={{
                                                        display: 'inline-block',
                                                        background: '#3498db',
                                                        color: 'white',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                        fontSize: '10px',
                                                        margin: '2px 3px 2px 0'
                                                    }}>
                                                        {COMPETENCES_LABELS[comp]}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 🔧 SECTION DE DEBUG - À RETIRER UNE FOIS LA CONFIGURATION TERMINÉE */}
            <div className="card">
                <h3>🔧 Configuration des employés</h3>
                <p style={{ color: '#e67e22', marginBottom: '15px' }}>
                    💡 Allez dans l'onglet <strong>"Employés"</strong> pour modifier les noms et compétences de vos employés.
                    Une fois configuré, cette section peut être retirée.
                </p>
            </div>

            {/* Analyse de charge par compétence */}
            <div className="card">
                <h3>🎯 Analyse de la charge de travail par compétence</h3>
                <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
                    Cette analyse montre la répartition du travail futur selon les compétences disponibles dans votre équipe.
                </p>
                <div style={{ marginBottom: 12 }}>
                    <button
                        onClick={() => setMontrerDetailsCharge(v => !v)}
                        style={{
                            padding: '6px 10px',
                            backgroundColor: '#6c5ce7',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12
                        }}
                    >
                        {montrerDetailsCharge ? 'Masquer les détails' : 'Afficher les détails'}
                    </button>
                </div>

                <div className="competences-analysis">
                    {analysePlanification.charges
                        .filter(charge => charge.heuresNecessaires > 0 || charge.heuresDisponibles > 0)
                        .sort((a, b) => b.utilisation - a.utilisation)
                        .map(charge => (
                            <div key={charge.competence} style={{
                                padding: '15px',
                                marginBottom: '15px',
                                border: `2px solid ${charge.surcharge ? '#e74c3c' : charge.utilisation > 80 ? '#f39c12' : '#27ae60'}`,
                                borderRadius: '8px',
                                backgroundColor: charge.surcharge ? '#fdf2f2' : charge.utilisation > 80 ? '#fefbf2' : '#f2fdf2'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50' }}>{charge.label}</h4>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        backgroundColor: charge.surcharge ? '#e74c3c' : charge.utilisation > 80 ? '#f39c12' : '#27ae60'
                                    }}>
                                        {Math.round(charge.utilisation)}%
                                    </span>
                                </div>

                                {/* Détails (repliable) */}
                                {montrerDetailsCharge && charge.heuresNecessaires > 0 && (
                                    <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                                        <strong>🔧 DEBUG {charge.label.toUpperCase()}:</strong>
                                        <br />
                                        <strong>Projets avec {charge.label.toLowerCase()} restant:</strong>
                                        <ul style={{ marginTop: '5px', fontSize: '12px' }}>
                                            {projetsActifs
                                                .filter(projet => projet.etapes.some(etape =>
                                                    etape.competenceRequise.includes(charge.competence) &&
                                                    etape.heuresEstimees > 0 &&
                                                    etape.statut !== 'termine'
                                                ))
                                                .map(projet => {
                                                    const etapesCompetence = projet.etapes.filter(etape =>
                                                        etape.competenceRequise.includes(charge.competence) &&
                                                        etape.heuresEstimees > 0 &&
                                                        etape.statut !== 'termine'
                                                    );
                                                    const heuresRestantes = etapesCompetence.reduce((sum, etape) => sum + etape.heuresEstimees, 0);
                                                    return (
                                                        <li key={projet.id} style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                                            <strong>{projet.nom}</strong> - {heuresRestantes}h restantes
                                                            {etapesCompetence.map(etape => (
                                                                <div key={etape.id} style={{
                                                                    marginTop: '5px',
                                                                    padding: '5px',
                                                                    backgroundColor: '#e9ecef',
                                                                    borderRadius: '3px',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center'
                                                                }}>
                                                                    <span>
                                                                        <strong>{etape.etape}</strong> ({etape.heuresEstimees}h) -
                                                                        <span style={{
                                                                            color: etape.statut === 'en_cours' ? '#f39c12' :
                                                                                etape.statut === 'bloque' ? '#e74c3c' : '#7f8c8d',
                                                                            fontWeight: 'bold'
                                                                        }}>
                                                                            {etape.statut}
                                                                        </span>
                                                                        {etape.employeAffecte && (
                                                                            <span style={{
                                                                                marginLeft: '8px',
                                                                                color: '#2c3e50',
                                                                                backgroundColor: '#ecf0f1',
                                                                                padding: '2px 6px',
                                                                                borderRadius: '10px',
                                                                                fontSize: '10px'
                                                                            }}>
                                                                                👤 {employes.find(e => e.id === etape.employeAffecte)?.nom || 'Inconnu'}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                                        {/* Sélecteur d'employé */}
                                                                        <select
                                                                            value={etape.employeAffecte || ''}
                                                                            onChange={(e) => changerAffectationEtape(projet.id, etape.id, e.target.value || null)}
                                                                            style={{
                                                                                padding: '2px 4px',
                                                                                fontSize: '10px',
                                                                                borderRadius: '3px',
                                                                                border: '1px solid #bdc3c7'
                                                                            }}
                                                                        >
                                                                            <option value="">Non assigné</option>
                                                                            {employes
                                                                                .filter(emp =>
                                                                                    // 🔧 CORRECTION: Seulement les employés avec TOUTES les compétences requises
                                                                                    etape.competenceRequise.every(comp => emp.competences.includes(comp))
                                                                                )
                                                                                .map(emp => (
                                                                                    <option key={emp.id} value={emp.id}>
                                                                                        {emp.nom} ({calculerChargeEmploye(emp.id)}h)
                                                                                    </option>
                                                                                ))
                                                                            }
                                                                        </select>
                                                                        {etape.statut !== 'en_cours' && (
                                                                            <button
                                                                                onClick={() => changerStatutEtape(projet.id, etape.id, 'en_cours')}
                                                                                style={{
                                                                                    padding: '2px 6px',
                                                                                    fontSize: '10px',
                                                                                    backgroundColor: '#f39c12',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '3px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                En cours
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => changerStatutEtape(projet.id, etape.id, 'termine')}
                                                                            style={{
                                                                                padding: '2px 6px',
                                                                                fontSize: '10px',
                                                                                backgroundColor: '#27ae60',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '3px',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            ✓ Terminé
                                                                        </button>
                                                                        {etape.statut !== 'bloque' && (
                                                                            <button
                                                                                onClick={() => changerStatutEtape(projet.id, etape.id, 'bloque')}
                                                                                style={{
                                                                                    padding: '2px 6px',
                                                                                    fontSize: '10px',
                                                                                    backgroundColor: '#e74c3c',
                                                                                    color: 'white',
                                                                                    border: 'none',
                                                                                    borderRadius: '3px',
                                                                                    cursor: 'pointer'
                                                                                }}
                                                                            >
                                                                                Bloqué
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </li>
                                                    );
                                                })
                                            }
                                        </ul>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', fontSize: '14px' }}>
                                    <div>
                                        <strong>👥 Employés:</strong> {charge.employesDisponibles}
                                    </div>
                                    <div>
                                        <strong>⏰ Heures dispo:</strong> {charge.heuresDisponibles}h/semaine
                                    </div>
                                    <div>
                                        <strong>📋 Heures requises:</strong> {Math.ceil(charge.heuresNecessaires)}h
                                    </div>
                                    <div>
                                        <strong>📅 Délai estimé:</strong> {
                                            charge.heuresDisponibles > 0
                                                ? `${Math.ceil(charge.heuresNecessaires / charge.heuresDisponibles)} semaines`
                                                : 'Impossible'
                                        }
                                    </div>
                                </div>

                                {/* Barre de progression */}
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: '#ecf0f1',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${Math.min(charge.utilisation, 100)}%`,
                                            height: '100%',
                                            backgroundColor: charge.surcharge ? '#e74c3c' : charge.utilisation > 80 ? '#f39c12' : '#27ae60',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>

                                {charge.surcharge && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#e74c3c' }}>
                                        ⚠️ Surcharge de {Math.ceil(charge.heuresNecessaires - charge.heuresDisponibles)}h détectée.
                                        Considérez l'embauche ou la sous-traitance.
                                    </div>
                                )}
                            </div>
                        ))}
                </div>

                {analysePlanification.charges.every(c => c.heuresNecessaires === 0) && (
                    <div style={{ textAlign: 'center', color: '#7f8c8d', margin: '40px 0' }}>
                        Aucun projet en attente. Ajoutez des projets pour voir l'analyse de charge.
                    </div>
                )}
            </div>

            {/* Capacité de l'équipe */}
            <div className="card">
                <h3>👥 Capacité de l'équipe</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                    {employes.map(employe => (
                        <div key={employe.id} style={{
                            padding: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa'
                        }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{employe.nom}</h4>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>⏰</strong> {employe.heuresParSemaine}h/semaine
                            </div>
                            <div>
                                <strong>🛠️ Compétences:</strong>
                                <div style={{ marginTop: '5px' }}>
                                    {employe.competences.map(comp => (
                                        <span key={comp} style={{
                                            display: 'inline-block',
                                            background: '#3498db',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            margin: '2px 3px 2px 0'
                                        }}>
                                            {COMPETENCES_LABELS[comp]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {employes.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#7f8c8d', margin: '40px 0' }}>
                        Aucun employé enregistré. Allez dans l'onglet "Employés" pour ajouter votre équipe.
                    </div>
                )}

                {employes.length > 0 && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
                        <strong>📊 Résumé de l'équipe:</strong>
                        <div style={{ marginTop: '8px' }}>
                            Total heures/semaine: {employes.reduce((sum, emp) => sum + emp.heuresParSemaine, 0)}h
                            <br />
                            Capacité mensuelle: {Math.ceil(employes.reduce((sum, emp) => sum + emp.heuresParSemaine, 0) * 4.33)}h
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
