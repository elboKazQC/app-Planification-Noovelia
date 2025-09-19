import { useState, useEffect } from 'react';
import { Projet, Employe, TemplateProjet, StatutTache, MaterielProjet } from './types';
import SimplePlanner from './components/SimplePlanner';
import './App.css';

function App() {
    // Simplified app: always show SimplePlanner. Keep state loaders to reuse existing data seeds.
    const [employes] = useState<Employe[]>(() => {
        const savedEmployes = localStorage.getItem('noovelia-employes');
        if (savedEmployes) {
            return JSON.parse(savedEmployes);
        }
        // Données initiales par défaut
        return [
            {
                id: '1',
                nom: 'Soudeur/Assembleur 1',
                competences: ['soudage', 'assemblage'],
                heuresParSemaine: 40
            },
            {
                id: '2',
                nom: 'Soudeur/Assembleur 2',
                competences: ['soudage', 'assemblage'],
                heuresParSemaine: 40
            },
            {
                id: '3',
                nom: 'Électromécanicien 1',
                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],
                heuresParSemaine: 35
            },
            {
                id: '4',
                nom: 'Électromécanicien 2',
                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],
                heuresParSemaine: 35
            },
            {
                id: '5',
                nom: 'Machiniste',
                competences: ['machinage', 'coupe_materiel', 'soudage', 'assemblage'],
                heuresParSemaine: 25
            },
            {
                id: '6',
                nom: 'Acheteur 1',
                competences: ['achat'],
                heuresParSemaine: 40
            },
            {
                id: '7',
                nom: 'Acheteur 2',
                competences: ['achat'],
                heuresParSemaine: 30
            }
        ];
    });

    // Templates par défaut avec les délais standards Noovelia
    const templates: TemplateProjet[] = [
        {
            id: 'template-amr-standard',
            nom: 'AMR Standard',
            type: 'AMR',
            description: 'Template AMR avec délais standards Noovelia',
            etapes: [
                { etape: 'achat', competenceRequise: ['achat'], heuresEstimees: 16 }, // 2 mois de délai, mais 16h de travail actif
                { etape: 'coupe_materiel', competenceRequise: ['coupe_materiel'], heuresEstimees: 1 }, // 🔧 CORRIGÉ: 1h seulement
                { etape: 'pre_assemblage_electrique', competenceRequise: ['electrique'], heuresEstimees: 32 }, // Préparation électrique
                { etape: 'soudage', competenceRequise: ['soudage'], heuresEstimees: 80 }, // 2 semaines
                { etape: 'peinture_externe', competenceRequise: [], heuresEstimees: 0 }, // 4 semaines délai (externe)
                { etape: 'assemblage', competenceRequise: ['assemblage'], heuresEstimees: 40 }, // 1 semaine mécanique
                { etape: 'assemblage_electrique_final', competenceRequise: ['electrique'], heuresEstimees: 64 }, // 1 sem + 3 jours
                { etape: 'test_qualite', competenceRequise: ['test_qualite'], heuresEstimees: 8 }, // 🔧 CORRIGÉ: Seulement test qualité
                { etape: 'test_logiciel', competenceRequise: [], heuresEstimees: 0 } // 1 semaine délai (équipe externe)
            ]
        },
        {
            id: 'template-accessoire',
            nom: 'Accessoire Standard',
            type: 'Accessoire',
            description: 'Template accessoire avec délais proportionnels',
            etapes: [
                { etape: 'achat', competenceRequise: ['achat'], heuresEstimees: 8 }, // Délai réduit pour accessoire
                { etape: 'coupe_materiel', competenceRequise: ['coupe_materiel'], heuresEstimees: 1 }, // 🔧 CORRIGÉ: 1h seulement
                { etape: 'pre_assemblage_electrique', competenceRequise: ['electrique'], heuresEstimees: 16 },
                { etape: 'soudage', competenceRequise: ['soudage'], heuresEstimees: 40 }, // 1 semaine
                { etape: 'peinture_externe', competenceRequise: [], heuresEstimees: 0 }, // Délai externe
                { etape: 'assemblage', competenceRequise: ['assemblage'], heuresEstimees: 20 }, // 0.5 semaine
                { etape: 'assemblage_electrique_final', competenceRequise: ['electrique'], heuresEstimees: 32 }, // 4 jours
                { etape: 'test_qualite', competenceRequise: ['test_qualite'], heuresEstimees: 4 }, // 🔧 CORRIGÉ: Seulement test qualité
                { etape: 'test_logiciel', competenceRequise: [], heuresEstimees: 0 }
            ]
        }
    ];

    // Matériaux standards pour les projets
    const materiauxStandard: MaterielProjet[] = [
        // Matériaux pour AMR
        {
            id: 'acier-inox-316l',
            nom: 'Acier Inox 316L',
            quantite: 50,
            unite: 'kg',
            fournisseur: 'Métal Plus Inc.',
            delaiLivraisonJours: 45, // 1.5 mois
            prix: 8.50,
            enStock: 25,
            seuilAlerte: 20,
            statut: 'a_commander'
        },
        {
            id: 'tole-acier-5mm',
            nom: 'Tôle Acier 5mm',
            quantite: 20,
            unite: 'm²',
            fournisseur: 'Acier du Québec',
            delaiLivraisonJours: 60, // 2 mois
            prix: 45.00,
            enStock: 5,
            seuilAlerte: 10,
            statut: 'a_commander'
        },
        {
            id: 'moteur-brushless-24v',
            nom: 'Moteur Brushless 24V',
            quantite: 4,
            unite: 'pcs',
            fournisseur: 'Électro Techno',
            delaiLivraisonJours: 75, // 2.5 mois
            prix: 850.00,
            enStock: 2,
            seuilAlerte: 3,
            statut: 'a_commander'
        },
        {
            id: 'carte-electronique-amr',
            nom: 'Carte Électronique AMR v3.2',
            quantite: 2,
            unite: 'pcs',
            fournisseur: 'CircuitTech Solutions',
            delaiLivraisonJours: 90, // 3 mois
            prix: 1200.00,
            enStock: 1,
            seuilAlerte: 2,
            statut: 'a_commander'
        },
        {
            id: 'cable-electrique-awg12',
            nom: 'Câble Électrique AWG12',
            quantite: 100,
            unite: 'm',
            fournisseur: 'Câblerie Moderne',
            delaiLivraisonJours: 30, // 1 mois
            prix: 2.50,
            enStock: 150,
            seuilAlerte: 50,
            statut: 'disponible'
        },
        {
            id: 'peinture-industrielle',
            nom: 'Peinture Industrielle Bleu Noovelia',
            quantite: 10,
            unite: 'L',
            fournisseur: 'Peinture Pro+',
            delaiLivraisonJours: 21, // 3 semaines
            prix: 85.00,
            enStock: 8,
            seuilAlerte: 5,
            statut: 'disponible'
        },
        // Matériaux pour Accessoires
        {
            id: 'aluminium-6061',
            nom: 'Aluminium 6061-T6',
            quantite: 15,
            unite: 'kg',
            fournisseur: 'Alu-Tech Québec',
            delaiLivraisonJours: 35, // ~1 mois
            prix: 12.00,
            enStock: 12,
            seuilAlerte: 8,
            statut: 'disponible'
        },
        {
            id: 'visserie-m8-inox',
            nom: 'Visserie M8 Inox (kit)',
            quantite: 50,
            unite: 'pcs',
            fournisseur: 'Visserie Plus',
            delaiLivraisonJours: 14, // 2 semaines
            prix: 1.25,
            enStock: 200,
            seuilAlerte: 100,
            statut: 'disponible'
        }
    ];

    // Fonction pour créer les projets par défaut
    const creerProjetsParDefaut = (): Projet[] => {
        // Fonction pour assigner les matériaux selon l'étape et le type de projet
        const obtenirMateriauxPourEtape = (etape: string, type: 'AMR' | 'Accessoire'): MaterielProjet[] => {
            const materiaux: MaterielProjet[] = [];

            if (type === 'AMR') {
                switch (etape) {
                    case 'achat':
                        materiaux.push(
                            { ...materiauxStandard.find(m => m.id === 'acier-inox-316l')! },
                            { ...materiauxStandard.find(m => m.id === 'tole-acier-5mm')! },
                            { ...materiauxStandard.find(m => m.id === 'moteur-brushless-24v')! },
                            { ...materiauxStandard.find(m => m.id === 'carte-electronique-amr')! }
                        );
                        break;
                    case 'pre_assemblage_electrique':
                    case 'assemblage_electrique_final':
                        materiaux.push(
                            { ...materiauxStandard.find(m => m.id === 'cable-electrique-awg12')! },
                            { ...materiauxStandard.find(m => m.id === 'carte-electronique-amr')! }
                        );
                        break;
                    case 'soudage':
                        materiaux.push(
                            { ...materiauxStandard.find(m => m.id === 'acier-inox-316l')! },
                            { ...materiauxStandard.find(m => m.id === 'tole-acier-5mm')! }
                        );
                        break;
                    case 'peinture_externe':
                        materiaux.push({ ...materiauxStandard.find(m => m.id === 'peinture-industrielle')! });
                        break;
                    case 'assemblage':
                        materiaux.push(
                            { ...materiauxStandard.find(m => m.id === 'moteur-brushless-24v')! },
                            { ...materiauxStandard.find(m => m.id === 'visserie-m8-inox')! }
                        );
                        break;
                }
            } else if (type === 'Accessoire') {
                switch (etape) {
                    case 'achat':
                        materiaux.push(
                            { ...materiauxStandard.find(m => m.id === 'aluminium-6061')! },
                            { ...materiauxStandard.find(m => m.id === 'visserie-m8-inox')! }
                        );
                        break;
                    case 'soudage':
                        materiaux.push({ ...materiauxStandard.find(m => m.id === 'aluminium-6061')! });
                        break;
                    case 'peinture_externe':
                        materiaux.push({ ...materiauxStandard.find(m => m.id === 'peinture-industrielle')! });
                        break;
                    case 'assemblage':
                    case 'assemblage_electrique_final':
                        materiaux.push({ ...materiauxStandard.find(m => m.id === 'visserie-m8-inox')! });
                        break;
                }
            }

            return materiaux.filter(m => m !== undefined);
        };

        // Fonction pour créer un projet basé sur un template avec statuts personnalisés
        const creerProjetAvecTemplate = (
            nom: string,
            templateType: 'AMR' | 'Accessoire',
            dateCommandeOffset: number,
            dateVoulueOffset: number,
            priorite: 'basse' | 'normale' | 'haute' | 'urgente' = 'normale',
            statutsPersonnalises?: Record<string, StatutTache>
        ): Projet => {
            const template = templates.find(t => t.type === templateType);
            if (!template) throw new Error(`Template ${templateType} non trouvé`);

            const maintenant = new Date();
            const dateCommande = new Date(maintenant.getTime() + dateCommandeOffset * 24 * 60 * 60 * 1000);
            const dateVoulue = new Date(maintenant.getTime() + dateVoulueOffset * 24 * 60 * 60 * 1000);

            const etapes = template.etapes.map(etapeTemplate => {
                const statutPersonnalise = statutsPersonnalises?.[etapeTemplate.etape];
                const materiauxRequis = obtenirMateriauxPourEtape(etapeTemplate.etape, templateType);

                return {
                    id: `${Date.now()}-${Math.random()}-${etapeTemplate.etape}`,
                    etape: etapeTemplate.etape,
                    competenceRequise: etapeTemplate.competenceRequise,
                    heuresEstimees: etapeTemplate.heuresEstimees,
                    dependances: [],
                    materielRequis: materiauxRequis,
                    statut: statutPersonnalise || 'en_attente' as const,
                    historiqueStatuts: [],
                    dateCreation: maintenant
                };
            });

            return {
                id: `${Date.now()}-${Math.random()}`,
                nom,
                description: `Projet ${templateType.toLowerCase()} créé automatiquement`,
                dateCommande,
                dateVoulue,
                quantite: 1,
                etapes,
                statut: 'en_attente' as const,
                priorite
            };
        };

        return [
            // Accessoires CSTE2010E - EN ATTENTE (pas de matériel) - RÉEL selon Excel
            creerProjetAvecTemplate('Accessoire CSTE2010E #10', 'Accessoire', -15, 45, 'haute', {
                achat: 'en_attente', coupe_materiel: 'en_attente', soudage: 'en_attente',
                assemblage: 'en_attente', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('Accessoire CSTE2010E #9', 'Accessoire', -10, 50, 'haute', {
                achat: 'en_attente', coupe_materiel: 'en_attente', soudage: 'en_attente',
                assemblage: 'en_attente', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),

            // Accessoires Uniboard - ÉLECTRIQUE EN COURS - RÉEL selon Excel
            creerProjetAvecTemplate('Accessoire Uniboard #1', 'Accessoire', -5, 55, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_cours', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('Accessoire Uniboard #2', 'Accessoire', 0, 60, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'termine', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('Accessoire Uniboard #3', 'Accessoire', 5, 65, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_cours', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('Accessoire Uniboard #4', 'Accessoire', 10, 70, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('Accessoire Uniboard #5', 'Accessoire', 15, 75, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('Accessoire Uniboard #6', 'Accessoire', 20, 80, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),

            // AMR PL 20250614-4 série - ACHAT EN COURS (matériel pas encore arrivé) - RÉEL selon Excel
            creerProjetAvecTemplate('AMR PL 20250614-4 #14', 'AMR', -20, 70, 'urgente', {
                achat: 'en_cours', coupe_materiel: 'en_attente', soudage: 'en_attente',
                assemblage: 'en_attente', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR PL 20250614-4 #15', 'AMR', -15, 75, 'urgente', {
                achat: 'en_cours', coupe_materiel: 'en_attente', soudage: 'en_attente',
                assemblage: 'en_attente', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR PL 20250614-4 #16', 'AMR', -10, 80, 'urgente', {
                achat: 'en_cours', coupe_materiel: 'en_attente', soudage: 'en_attente',
                assemblage: 'en_attente', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR PL 20250614-4 #17', 'AMR', -5, 85, 'urgente', {
                achat: 'en_cours', coupe_materiel: 'en_attente', soudage: 'en_attente',
                assemblage: 'en_attente', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),

            // AMR R&D - BLOQUÉ À L'ÉLECTRIQUE - RÉEL selon Excel
            creerProjetAvecTemplate('AMR R&D #1', 'AMR', -25, 120, 'urgente', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'bloque', test_qualite: 'en_attente'
            }),

            // AMR Standard série - TERMINÉS - RÉEL selon Excel
            creerProjetAvecTemplate('AMR Standard #11', 'AMR', 0, 90, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'termine', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR Standard #12', 'AMR', 5, 95, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'termine', test_qualite: 'en_cours'
            }),
            creerProjetAvecTemplate('AMR Standard #13', 'AMR', 10, 100, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'termine', test_qualite: 'en_cours'
            }),

            // AMR Uniboard série - ÉLECTRIQUE EN COURS/TERMINÉ - RÉEL selon Excel
            creerProjetAvecTemplate('AMR Uniboard #1', 'AMR', 15, 105, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_cours', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR Uniboard #2', 'AMR', 20, 110, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR Uniboard #3', 'AMR', 25, 115, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'termine', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR Uniboard #4', 'AMR', 30, 120, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'termine', test_qualite: 'en_cours'
            }),
            creerProjetAvecTemplate('AMR Uniboard #5', 'AMR', 35, 125, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_cours', test_qualite: 'en_attente'
            }),
            creerProjetAvecTemplate('AMR Uniboard #6', 'AMR', 40, 130, 'normale', {
                achat: 'termine', coupe_materiel: 'termine', soudage: 'termine', peinture_externe: 'termine',
                assemblage: 'termine', assemblage_electrique_final: 'en_attente', test_qualite: 'en_attente'
            }),
        ];
    };

    const [projets, setProjets] = useState<Projet[]>(() => {
        const savedProjets = localStorage.getItem('noovelia-projets');

        // Vérifier si on a la version avec les vrais statuts
        const VERSION_STATUTS_CSV = 'v1.0-csv-statuts';
        const versionActuelle = localStorage.getItem('noovelia-version');

        if (versionActuelle !== VERSION_STATUTS_CSV) {
            // Première fois ou version obsolète - créer avec les vrais statuts du CSV
            localStorage.setItem('noovelia-version', VERSION_STATUTS_CSV);
            localStorage.removeItem('noovelia-projets'); // Vider l'ancien cache
            return creerProjetsParDefaut();
        }

        // Si pas de données sauvées OU si liste vide, charger les projets par défaut
        if (!savedProjets) {
            return creerProjetsParDefaut();
        }

        try {
            const parsedProjets = JSON.parse(savedProjets, (key, value) => {
                // Convertir les dates string en objets Date
                if (key === 'dateCommande' || key === 'dateVoulue' || key === 'dateChangement' ||
                    key === 'dateDebut' || key === 'dateFin' || key === 'dateCreation') {
                    return value ? new Date(value) : value;
                }
                return value;
            });

            // Si la liste sauvée est vide, charger les projets par défaut
            if (!parsedProjets || parsedProjets.length === 0) {
                return creerProjetsParDefaut();
            }

            return parsedProjets;
        } catch (error) {
            // En cas d'erreur de parsing, charger les projets par défaut
            console.error('Erreur lors du chargement des projets sauvés:', error);
            return creerProjetsParDefaut();
        }
    });

    // Plus de sauvegarde automatique des employés dans la version simplifiée

    // Sauvegarde automatique des projets (SANS mise à jour automatique des statuts pour éviter les boucles)
    useEffect(() => {
        localStorage.setItem('noovelia-projets', JSON.stringify(projets));
    }, [projets]);

    // Kanban archivé non utilisé dans la version simplifiée

    return (
        <div className="App">
            <header className="header">
                <h1>� Planificateur simplifié</h1>
            </header>
            <main className="main-content">
                <SimplePlanner employes={employes} projets={projets} setProjets={setProjets} />
            </main>
        </div>
    );
}

export default App;
