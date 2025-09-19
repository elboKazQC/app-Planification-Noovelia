import { ProjetKanban, KanbanColumn, TypeVehicule, PrioriteNiveau, MouvementHistoire } from '../types';

// Fonction pour convertir les projets de l'ancien format vers le Kanban
export const convertirProjetsVersKanban = (): ProjetKanban[] => {
    // Récupérer les anciens projets du localStorage
    const anciensProjetsSaved = localStorage.getItem('noovelia-projets');
    if (!anciensProjetsSaved) return [];

    try {
        const anciensProjets = JSON.parse(anciensProjetsSaved);

        return anciensProjets.map((ancienProjet: any, index: number): ProjetKanban => {
            // Mapper le type de véhicule
            let typeVehicule: TypeVehicule = 'AMR PL';
            let client = 'Client par défaut';

            if (ancienProjet.nom.includes('CSTE2010E')) {
                typeVehicule = 'Accessoire CSTE2010E';
                client = 'CSTE2010E';
            } else if (ancienProjet.nom.includes('Uniboard') && ancienProjet.nom.includes('Accessoire')) {
                typeVehicule = 'Accessoire Uniboard';
                client = 'Uniboard Corp';
            } else if (ancienProjet.nom.includes('Uniboard') && ancienProjet.nom.includes('AMR')) {
                typeVehicule = 'AMR Uniboard';
                client = 'Uniboard Corp';
            } else if (ancienProjet.nom.includes('R&D')) {
                typeVehicule = 'AMR R&D';
                client = 'R&D Interne';
            } else if (ancienProjet.nom.includes('AMR PL')) {
                typeVehicule = 'AMR PL';
                client = 'Client PL';
            } else if (ancienProjet.nom.includes('AMR FL')) {
                typeVehicule = 'AMR FL';
                client = 'Client FL';
            } else if (ancienProjet.nom.includes('Standard')) {
                typeVehicule = 'AMR PL';
                client = 'Client Standard';
            }

            // Déterminer la colonne actuelle basée sur l'état des étapes
            let colonneActuelle: KanbanColumn = 'nouveau_projet';

            if (ancienProjet.etapes) {
                // Analyser les étapes pour déterminer la position dans le Kanban
                const etapesTerminees = ancienProjet.etapes.filter((e: any) => e.statut === 'termine').length;
                const etapesEnCours = ancienProjet.etapes.find((e: any) => e.statut === 'en_cours');
                const etapesBloquees = ancienProjet.etapes.find((e: any) => e.statut === 'bloque');

                // Si il y a une étape bloquée, on reste dans l'étape correspondante
                if (etapesBloquees) {
                    switch (etapesBloquees.etape) {
                        case 'achat': colonneActuelle = 'achat'; break;
                        case 'soudage': colonneActuelle = 'soudage'; break;
                        case 'machinage': colonneActuelle = 'machinage'; break;
                        case 'peinture_externe': colonneActuelle = 'peinture'; break;
                        case 'assemblage': colonneActuelle = 'assemblage'; break;
                        case 'assemblage_electrique_final':
                        case 'pre_assemblage_electrique':
                            colonneActuelle = 'electrique'; break;
                        case 'test_qualite':
                        case 'test_logiciel':
                            colonneActuelle = 'test'; break;
                        default: colonneActuelle = 'nouveau_projet';
                    }
                }
                // Si il y a une étape en cours
                else if (etapesEnCours) {
                    switch (etapesEnCours.etape) {
                        case 'achat': colonneActuelle = 'achat'; break;
                        case 'soudage': colonneActuelle = 'soudage'; break;
                        case 'machinage': colonneActuelle = 'machinage'; break;
                        case 'peinture_externe': colonneActuelle = 'peinture'; break;
                        case 'assemblage': colonneActuelle = 'assemblage'; break;
                        case 'assemblage_electrique_final':
                        case 'pre_assemblage_electrique':
                            colonneActuelle = 'electrique'; break;
                        case 'test_qualite':
                        case 'test_logiciel':
                            colonneActuelle = 'test'; break;
                        default: colonneActuelle = 'nouveau_projet';
                    }
                }
                // Sinon, on regarde combien d'étapes sont terminées
                else if (etapesTerminees > 0) {
                    if (etapesTerminees >= 8) {
                        colonneActuelle = 'termine';
                    } else {
                        // Trouver la prochaine étape non terminée
                        const etapesOrdre = ['achat', 'soudage', 'machinage', 'peinture_externe', 'assemblage', 'assemblage_electrique_final', 'test_qualite'];
                        for (const etapeNom of etapesOrdre) {
                            const etape = ancienProjet.etapes.find((e: any) =>
                            (e.etape === etapeNom ||
                                (etapeNom === 'assemblage_electrique_final' && (e.etape === 'pre_assemblage_electrique' || e.etape === 'assemblage_electrique_final')) ||
                                (etapeNom === 'test_qualite' && (e.etape === 'test_qualite' || e.etape === 'test_logiciel')))
                            );

                            if (etape && etape.statut !== 'termine') {
                                switch (etapeNom) {
                                    case 'achat': colonneActuelle = 'achat'; break;
                                    case 'soudage': colonneActuelle = 'soudage'; break;
                                    case 'machinage': colonneActuelle = 'machinage'; break;
                                    case 'peinture_externe': colonneActuelle = 'peinture'; break;
                                    case 'assemblage': colonneActuelle = 'assemblage'; break;
                                    case 'assemblage_electrique_final': colonneActuelle = 'electrique'; break;
                                    case 'test_qualite': colonneActuelle = 'test'; break;
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // Créer l'historique des mouvements
            const maintenant = new Date();
            const dateCreation = ancienProjet.dateCommande ? new Date(ancienProjet.dateCommande) : maintenant;

            const historiqueMovements: MouvementHistoire[] = [
                {
                    id: `${Date.now()}-${index}-init`,
                    projetId: `kanban-${Date.now()}-${index}`,
                    colonneSource: null,
                    colonneDestination: 'nouveau_projet',
                    dateMovement: dateCreation
                }
            ];

            // Si le projet n'est pas en "nouveau_projet", ajouter le mouvement vers la colonne actuelle
            if (colonneActuelle !== 'nouveau_projet') {
                historiqueMovements.push({
                    id: `${Date.now()}-${index}-move`,
                    projetId: `kanban-${Date.now()}-${index}`,
                    colonneSource: 'nouveau_projet',
                    colonneDestination: colonneActuelle,
                    dateMovement: ancienProjet.dateModification ? new Date(ancienProjet.dateModification) : maintenant
                });
            }

            // Générer un numéro de projet unique
            const typeCode = typeVehicule.replace(/\s+/g, '').substring(0, 3).toUpperCase();
            const annee = new Date().getFullYear();
            const numero = `${typeCode}-${annee}-${(index + 1).toString().padStart(3, '0')}`;

            return {
                id: `kanban-${Date.now()}-${index}`,
                numero: numero,
                nom: ancienProjet.nom,
                typeVehicule: typeVehicule,
                client: client,
                priorite: (ancienProjet.priorite as PrioriteNiveau) || 'normale',
                colonneActuelle: colonneActuelle,
                dateCreation: dateCreation,
                dateModification: maintenant,
                description: ancienProjet.description || `Projet ${typeVehicule} converti automatiquement`,
                historiqueMovements: historiqueMovements,
                estArchive: colonneActuelle === 'termine',
                dateArchivage: colonneActuelle === 'termine' ? maintenant : undefined
            };
        });
    } catch (error) {
        console.error('Erreur lors de la conversion des projets:', error);
        return [];
    }
};

// Fonction pour initialiser le Kanban avec les projets convertis
export const initialiserKanbanAvecProjetsExistants = () => {
    const projetsKanban = convertirProjetsVersKanban();

    if (projetsKanban.length > 0) {
        // Séparer les projets actifs et archivés
        const projetsActifs = projetsKanban.filter(p => !p.estArchive);
        const projetsArchives = projetsKanban.filter(p => p.estArchive);

        // Créer la structure Kanban
        const kanbanState = {
            projets: projetsActifs,
            projetsArchives: projetsArchives,
            colonnes: {
                nouveau_projet: { id: 'nouveau_projet' as const, titre: 'Nouveau Projet', couleur: '#e3f2fd', projets: [] as string[] },
                achat: { id: 'achat' as const, titre: 'Achat', couleur: '#f3e5f5', projets: [] as string[] },
                soudage: { id: 'soudage' as const, titre: 'Soudage', couleur: '#fff3e0', projets: [] as string[] },
                machinage: { id: 'machinage' as const, titre: 'Machinage', couleur: '#e8f5e8', projets: [] as string[] },
                peinture: { id: 'peinture' as const, titre: 'Peinture', couleur: '#fce4ec', projets: [] as string[] },
                assemblage: { id: 'assemblage' as const, titre: 'Assemblage', couleur: '#f1f8e9', projets: [] as string[] },
                electrique: { id: 'electrique' as const, titre: 'Électrique', couleur: '#fff8e1', projets: [] as string[] },
                test: { id: 'test' as const, titre: 'Test', couleur: '#e0f2f1', projets: [] as string[] },
                termine: { id: 'termine' as const, titre: 'Terminé', couleur: '#e8f5e8', projets: [] as string[] }
            }
        };

        // Assigner les projets aux colonnes
        projetsActifs.forEach(projet => {
            kanbanState.colonnes[projet.colonneActuelle].projets.push(projet.id);
        });

        // Sauvegarder dans localStorage
        localStorage.setItem('noovelia-kanban-state', JSON.stringify(kanbanState));
        localStorage.setItem('noovelia-kanban-initialized', 'true');

        console.log(`✅ ${projetsKanban.length} projets convertis vers le Kanban (${projetsActifs.length} actifs, ${projetsArchives.length} archivés)`);

        return kanbanState;
    }

    return null;
};
