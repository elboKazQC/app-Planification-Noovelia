import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import { Projet, Employe } from './types';

import SimplePlanner from './components/SimplePlanner';import { Projet, Employe, TemplateProjet, StatutTache, MaterielProjet } from './types';import { Projet, Employe, TemplateProjet, StatutTache, MaterielProjet } from './types';

import UsineGame from './components/UsineGame';

import './App.css';import SimplePlanner from './components/SimplePlanner';import SimplePlanner from './components/SimplePlanner';



function App() {import UsineGame from './components/UsineGame';import UsineGame from './components/UsineGame';

    // State pour gérer l'application active

    const [appActive, setAppActive] = useState<'planificateur' | 'usine'>(() => {import './App.css';import './App.css';

        return (localStorage.getItem('app-active') as 'planificateur' | 'usine') || 'planificateur';

    });



    const [employes] = useState<Employe[]>(() => {function App() {function App() {

        const savedEmployes = localStorage.getItem('noovelia-employes');

        if (savedEmployes) {    // State pour gérer l'application active    // State pour gérer l'application active

            return JSON.parse(savedEmployes);

        }    const [appActive, setAppActive] = useState<'planificateur' | 'usine'>(() => {    const [appActive, setAppActive] = useState<'planificateur' | 'usine'>(() => {

        // Données initiales par défaut

        return [        return (localStorage.getItem('app-active') as 'planificateur' | 'usine') || 'planificateur';        return (localStorage.getItem('app-active') as '    // Plus de sauvegarde automatique des employés dans la version simplifiée

            {

                id: '1',    });

                nom: 'Soudeur/Assembleur 1',

                competences: ['soudage', 'assemblage'],    // Sauvegarde automatique des projets (SANS mise à jour automatique des statuts pour éviter les boucles)

                heuresParSemaine: 40

            },    const [employes] = useState<Employe[]>(() => {    useEffect(() => {

            {

                id: '2',        const savedEmployes = localStorage.getItem('noovelia-employes');        localStorage.setItem('noovelia-projets', JSON.stringify(projets));

                nom: 'Soudeur/Assembleur 2',

                competences: ['soudage', 'assemblage'],        if (savedEmployes) {    }, [projets]);

                heuresParSemaine: 40

            },            return JSON.parse(savedEmployes);

            {

                id: '3',        }    // Sauvegarder l'app active

                nom: 'Électromécanicien 1',

                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],        // Données initiales par défaut    useEffect(() => {

                heuresParSemaine: 35

            },        return [        localStorage.setItem('app-active', appActive);

            {

                id: '4',            {    }, [appActive]);

                nom: 'Électromécanicien 2',

                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],                id: '1',

                heuresParSemaine: 35

            }                nom: 'Soudeur/Assembleur 1',    // Fonction pour changer d'application

        ];

    });                competences: ['soudage', 'assemblage'],    const changerApp = (nouvelleApp: 'planificateur' | 'usine') => {



    const [projets, setProjets] = useState<Projet[]>([]);                heuresParSemaine: 40        setAppActive(nouvelleApp);



    // Sauvegarder l'app active            },    };

    useEffect(() => {

        localStorage.setItem('app-active', appActive);            {

    }, [appActive]);

                id: '2',    // Kanban archivé non utilisé dans la version simplifiée

    // Fonction pour changer d'application

    const changerApp = (nouvelleApp: 'planificateur' | 'usine') => {                nom: 'Soudeur/Assembleur 2',

        setAppActive(nouvelleApp);

    };                competences: ['soudage', 'assemblage'],    return (



    return (                heuresParSemaine: 40        <div className="App">

        <div className="App">

            <header className="header">            },            <header className="header">

                <div className="header-left">

                    <h1>🏭 Applications Noovelia</h1>            {                <div className="header-left">

                </div>

                <nav className="app-nav">                id: '3',                    <h1>🏭 Applications Noovelia</h1>

                    <button 

                        className={appActive === 'planificateur' ? 'active' : ''}                 nom: 'Électromécanicien 1',                </div>

                        onClick={() => changerApp('planificateur')}

                    >                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],                <nav className="app-nav">

                        📊 Planificateur

                    </button>                heuresParSemaine: 35                    <button 

                    <button 

                        className={appActive === 'usine' ? 'active' : ''}             },                        className={appActive === 'planificateur' ? 'active' : ''} 

                        onClick={() => changerApp('usine')}

                    >            {                        onClick={() => changerApp('planificateur')}

                        🏭 Jeu d'Usine

                    </button>                id: '4',                    >

                </nav>

            </header>                nom: 'Électromécanicien 2',                        📊 Planificateur

            <main className="main-content">

                {appActive === 'planificateur' && (                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],                    </button>

                    <SimplePlanner employes={employes} projets={projets} setProjets={setProjets} />

                )}                heuresParSemaine: 35                    <button 

                {appActive === 'usine' && (

                    <UsineGame />            },                        className={appActive === 'usine' ? 'active' : ''} 

                )}

            </main>            {                        onClick={() => changerApp('usine')}

        </div>

    );                id: '5',                    >

}

                nom: 'Machiniste',                        🏭 Jeu d'Usine

export default App;
                competences: ['machinage', 'coupe_materiel', 'soudage', 'assemblage'],                    </button>

                heuresParSemaine: 25                </nav>

            },            </header>

            {            <main className="main-content">

                id: '6',                {appActive === 'planificateur' && (

                nom: 'Acheteur 1',                    <SimplePlanner employes={employes} projets={projets} setProjets={setProjets} />

                competences: ['achat'],                )}

                heuresParSemaine: 40                {appActive === 'usine' && (

            },                    <UsineGame />

            {                )}

                id: '7',            </main>

                nom: 'Acheteur 2',        </div>

                competences: ['achat'],    );sine') || 'planificateur';

                heuresParSemaine: 30    });

            }    const [employes] = useState<Employe[]>(() => {

        ];        const savedEmployes = localStorage.getItem('noovelia-employes');

    });        if (savedEmployes) {

            return JSON.parse(savedEmployes);

    // Templates par défaut avec les délais standards Noovelia        }

    const templates: TemplateProjet[] = [        // Données initiales par défaut

        {        return [

            id: 'template-amr-standard',            {

            nom: 'AMR Standard',                id: '1',

            type: 'AMR',                nom: 'Soudeur/Assembleur 1',

            description: 'Template AMR avec délais standards Noovelia',                competences: ['soudage', 'assemblage'],

            etapes: [                heuresParSemaine: 40

                { etape: 'achat', competenceRequise: ['achat'], heuresEstimees: 16 },            },

                { etape: 'coupe_materiel', competenceRequise: ['coupe_materiel'], heuresEstimees: 1 },            {

                { etape: 'pre_assemblage_electrique', competenceRequise: ['electrique'], heuresEstimees: 32 },                id: '2',

                { etape: 'soudage', competenceRequise: ['soudage'], heuresEstimees: 80 },                nom: 'Soudeur/Assembleur 2',

                { etape: 'peinture_externe', competenceRequise: [], heuresEstimees: 0 },                competences: ['soudage', 'assemblage'],

                { etape: 'assemblage', competenceRequise: ['assemblage'], heuresEstimees: 40 },                heuresParSemaine: 40

                { etape: 'assemblage_electrique_final', competenceRequise: ['electrique'], heuresEstimees: 64 },            },

                { etape: 'test_qualite', competenceRequise: ['test_qualite'], heuresEstimees: 8 },            {

                { etape: 'test_logiciel', competenceRequise: [], heuresEstimees: 0 }                id: '3',

            ]                nom: 'Électromécanicien 1',

        },                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],

        {                heuresParSemaine: 35

            id: 'template-accessoire',            },

            nom: 'Accessoire Standard',            {

            type: 'Accessoire',                id: '4',

            description: 'Template accessoire avec délais proportionnels',                nom: 'Électromécanicien 2',

            etapes: [                competences: ['electrique', 'assemblage', 'soudage', 'test_qualite'],

                { etape: 'achat', competenceRequise: ['achat'], heuresEstimees: 8 },                heuresParSemaine: 35

                { etape: 'coupe_materiel', competenceRequise: ['coupe_materiel'], heuresEstimees: 1 },            },

                { etape: 'pre_assemblage_electrique', competenceRequise: ['electrique'], heuresEstimees: 16 },            {

                { etape: 'soudage', competenceRequise: ['soudage'], heuresEstimees: 40 },                id: '5',

                { etape: 'peinture_externe', competenceRequise: [], heuresEstimees: 0 },                nom: 'Machiniste',

                { etape: 'assemblage', competenceRequise: ['assemblage'], heuresEstimees: 20 },                competences: ['machinage', 'coupe_materiel', 'soudage', 'assemblage'],

                { etape: 'assemblage_electrique_final', competenceRequise: ['electrique'], heuresEstimees: 32 },                heuresParSemaine: 25

                { etape: 'test_qualite', competenceRequise: ['test_qualite'], heuresEstimees: 4 },            },

                { etape: 'test_logiciel', competenceRequise: [], heuresEstimees: 0 }            {

            ]                id: '6',

        }                nom: 'Acheteur 1',

    ];                competences: ['achat'],

                heuresParSemaine: 40

    // Matériaux standards pour les projets            },

    const materiauxStandard: MaterielProjet[] = [            {

        {                id: '7',

            id: 'acier-inox-316l',                nom: 'Acheteur 2',

            nom: 'Acier inoxydable 316L',                competences: ['achat'],

            quantite: 50,                heuresParSemaine: 30

            unite: 'kg',            }

            fournisseur: 'Métaux Industriels',        ];

            delaiLivraisonJours: 14,    });

            prix: 8.50,

            enStock: 25,    // Templates par défaut avec les délais standards Noovelia

            seuilAlerte: 10,    const templates: TemplateProjet[] = [

            statut: 'disponible'        {

        },            id: 'template-amr-standard',

        {            nom: 'AMR Standard',

            id: 'tole-acier-5mm',            type: 'AMR',

            nom: 'Tôle acier 5mm',            description: 'Template AMR avec délais standards Noovelia',

            quantite: 20,            etapes: [

            unite: 'm²',                { etape: 'achat', competenceRequise: ['achat'], heuresEstimees: 16 }, // 2 mois de délai, mais 16h de travail actif

            fournisseur: 'Sidérurgie Française',                { etape: 'coupe_materiel', competenceRequise: ['coupe_materiel'], heuresEstimees: 1 }, // 🔧 CORRIGÉ: 1h seulement

            delaiLivraisonJours: 21,                { etape: 'pre_assemblage_electrique', competenceRequise: ['electrique'], heuresEstimees: 32 }, // Préparation électrique

            prix: 45.00,                { etape: 'soudage', competenceRequise: ['soudage'], heuresEstimees: 80 }, // 2 semaines

            enStock: 8,                { etape: 'peinture_externe', competenceRequise: [], heuresEstimees: 0 }, // 4 semaines délai (externe)

            seuilAlerte: 5,                { etape: 'assemblage', competenceRequise: ['assemblage'], heuresEstimees: 40 }, // 1 semaine mécanique

            statut: 'a_commander'                { etape: 'assemblage_electrique_final', competenceRequise: ['electrique'], heuresEstimees: 64 }, // 1 sem + 3 jours

        },                { etape: 'test_qualite', competenceRequise: ['test_qualite'], heuresEstimees: 8 }, // 🔧 CORRIGÉ: Seulement test qualité

        {                { etape: 'test_logiciel', competenceRequise: [], heuresEstimees: 0 } // 1 semaine délai (équipe externe)

            id: 'aluminium-6061',            ]

            nom: 'Aluminium 6061-T6',        },

            quantite: 30,        {

            unite: 'kg',            id: 'template-accessoire',

            fournisseur: 'Alu Spécialisé',            nom: 'Accessoire Standard',

            delaiLivraisonJours: 10,            type: 'Accessoire',

            prix: 12.00,            description: 'Template accessoire avec délais proportionnels',

            enStock: 15,            etapes: [

            seuilAlerte: 8,                { etape: 'achat', competenceRequise: ['achat'], heuresEstimees: 8 }, // Délai réduit pour accessoire

            statut: 'disponible'                { etape: 'coupe_materiel', competenceRequise: ['coupe_materiel'], heuresEstimees: 1 }, // 🔧 CORRIGÉ: 1h seulement

        }                { etape: 'pre_assemblage_electrique', competenceRequise: ['electrique'], heuresEstimees: 16 },

    ];                { etape: 'soudage', competenceRequise: ['soudage'], heuresEstimees: 40 }, // 1 semaine

                { etape: 'peinture_externe', competenceRequise: [], heuresEstimees: 0 }, // Délai externe

    // Fonction pour créer les projets par défaut                { etape: 'assemblage', competenceRequise: ['assemblage'], heuresEstimees: 20 }, // 0.5 semaine

    const creerProjetsParDefaut = (): Projet[] => {                { etape: 'assemblage_electrique_final', competenceRequise: ['electrique'], heuresEstimees: 32 }, // 4 jours

        const creerProjetAvecTemplate = (                { etape: 'test_qualite', competenceRequise: ['test_qualite'], heuresEstimees: 4 }, // 🔧 CORRIGÉ: Seulement test qualité

            nom: string,                { etape: 'test_logiciel', competenceRequise: [], heuresEstimees: 0 }

            templateType: 'AMR' | 'Accessoire',            ]

            dateCommandeOffset: number,        }

            dateVoulueOffset: number,    ];

            priorite: 'basse' | 'normale' | 'haute' | 'urgente' = 'normale',

            statutsPersonnalises?: Record<string, StatutTache>    // Matériaux standards pour les projets

        ): Projet => {    const materiauxStandard: MaterielProjet[] = [

            const template = templates.find(t => t.type === templateType);        // Matériaux pour AMR

            if (!template) throw new Error(`Template ${templateType} non trouvé`);        {

            id: 'acier-inox-316l',

            const maintenant = new Date();            nom: 'Acier Inox 316L',

            const dateCommande = new Date(maintenant.getTime() + dateCommandeOffset * 24 * 60 * 60 * 1000);            quantite: 50,

            const dateVoulue = new Date(maintenant.getTime() + dateVoulueOffset * 24 * 60 * 60 * 1000);            unite: 'kg',

            fournisseur: 'Métal Plus Inc.',

            const etapes = template.etapes.map(etapeTemplate => {            delaiLivraisonJours: 45, // 1.5 mois

                const statutPersonnalise = statutsPersonnalises?.[etapeTemplate.etape];            prix: 8.50,

                            enStock: 25,

                return {            seuilAlerte: 20,

                    id: `${Date.now()}-${Math.random()}-${etapeTemplate.etape}`,            statut: 'a_commander'

                    etape: etapeTemplate.etape,        },

                    competenceRequise: etapeTemplate.competenceRequise,        {

                    heuresEstimees: etapeTemplate.heuresEstimees,            id: 'tole-acier-5mm',

                    dependances: [],            nom: 'Tôle Acier 5mm',

                    materielRequis: [],            quantite: 20,

                    statut: statutPersonnalise || 'en_attente' as const,            unite: 'm²',

                    historiqueStatuts: [],            fournisseur: 'Acier du Québec',

                    dateCreation: maintenant            delaiLivraisonJours: 60, // 2 mois

                };            prix: 45.00,

            });            enStock: 5,

            seuilAlerte: 10,

            return {            statut: 'a_commander'

                id: `${Date.now()}-${Math.random()}`,        },

                nom,        {

                description: `Projet ${templateType.toLowerCase()} créé automatiquement`,            id: 'moteur-brushless-24v',

                dateCommande,            nom: 'Moteur Brushless 24V',

                dateVoulue,            quantite: 4,

                quantite: 1,            unite: 'pcs',

                etapes,            fournisseur: 'Électro Techno',

                statut: 'en_attente' as const,            delaiLivraisonJours: 75, // 2.5 mois

                priorite            prix: 850.00,

            };            enStock: 2,

        };            seuilAlerte: 3,

            statut: 'a_commander'

        return [        },

            creerProjetAvecTemplate('AMR Standard #1', 'AMR', 0, 90, 'normale'),        {

            creerProjetAvecTemplate('AMR Standard #2', 'AMR', 5, 95, 'normale'),            id: 'carte-electronique-amr',

            creerProjetAvecTemplate('Accessoire Uniboard #1', 'Accessoire', -5, 55, 'normale'),            nom: 'Carte Électronique AMR v3.2',

            creerProjetAvecTemplate('Accessoire CSTE2010E #1', 'Accessoire', -15, 45, 'haute'),            quantite: 2,

        ];            unite: 'pcs',

    };            fournisseur: 'CircuitTech Solutions',

            delaiLivraisonJours: 90, // 3 mois

    const [projets, setProjets] = useState<Projet[]>(() => {            prix: 1200.00,

        const savedProjets = localStorage.getItem('noovelia-projets');            enStock: 1,

                    seuilAlerte: 2,

        if (!savedProjets) {            statut: 'a_commander'

            return creerProjetsParDefaut();        },

        }        {

            id: 'cable-electrique-awg12',

        try {            nom: 'Câble Électrique AWG12',

            const parsedProjets = JSON.parse(savedProjets, (key, value) => {            quantite: 100,

                if (key === 'dateCommande' || key === 'dateVoulue' || key === 'dateChangement' ||            unite: 'm',

                    key === 'dateDebut' || key === 'dateFin' || key === 'dateCreation') {            fournisseur: 'Câblerie Moderne',

                    return value ? new Date(value) : value;            delaiLivraisonJours: 30, // 1 mois

                }            prix: 2.50,

                return value;            enStock: 150,

            });            seuilAlerte: 50,

            statut: 'disponible'

            if (!parsedProjets || parsedProjets.length === 0) {        },

                return creerProjetsParDefaut();        {

            }            id: 'peinture-industrielle',

            nom: 'Peinture Industrielle Bleu Noovelia',

            return parsedProjets;            quantite: 10,

        } catch (error) {            unite: 'L',

            console.error('Erreur lors du chargement des projets sauvés:', error);            fournisseur: 'Peinture Pro+',

            return creerProjetsParDefaut();            delaiLivraisonJours: 21, // 3 semaines

        }            prix: 85.00,

    });            enStock: 8,

            seuilAlerte: 5,

    // Sauvegarde automatique des projets            statut: 'disponible'

    useEffect(() => {        },

        localStorage.setItem('noovelia-projets', JSON.stringify(projets));        // Matériaux pour Accessoires

    }, [projets]);        {

            id: 'aluminium-6061',

    // Sauvegarder l'app active            nom: 'Aluminium 6061-T6',

    useEffect(() => {            quantite: 15,

        localStorage.setItem('app-active', appActive);            unite: 'kg',

    }, [appActive]);            fournisseur: 'Alu-Tech Québec',

            delaiLivraisonJours: 35, // ~1 mois

    // Fonction pour changer d'application            prix: 12.00,

    const changerApp = (nouvelleApp: 'planificateur' | 'usine') => {            enStock: 12,

        setAppActive(nouvelleApp);            seuilAlerte: 8,

    };            statut: 'disponible'

        },

    return (        {

        <div className="App">            id: 'visserie-m8-inox',

            <header className="header">            nom: 'Visserie M8 Inox (kit)',

                <div className="header-left">            quantite: 50,

                    <h1>🏭 Applications Noovelia</h1>            unite: 'pcs',

                </div>            fournisseur: 'Visserie Plus',

                <nav className="app-nav">            delaiLivraisonJours: 14, // 2 semaines

                    <button             prix: 1.25,

                        className={appActive === 'planificateur' ? 'active' : ''}             enStock: 200,

                        onClick={() => changerApp('planificateur')}            seuilAlerte: 100,

                    >            statut: 'disponible'

                        📊 Planificateur        }

                    </button>    ];

                    <button 

                        className={appActive === 'usine' ? 'active' : ''}     // Fonction pour créer les projets par défaut

                        onClick={() => changerApp('usine')}    const creerProjetsParDefaut = (): Projet[] => {

                    >        // Fonction pour assigner les matériaux selon l'étape et le type de projet

                        🏭 Jeu d'Usine        const obtenirMateriauxPourEtape = (etape: string, type: 'AMR' | 'Accessoire'): MaterielProjet[] => {

                    </button>            const materiaux: MaterielProjet[] = [];

                </nav>

            </header>            if (type === 'AMR') {

            <main className="main-content">                switch (etape) {

                {appActive === 'planificateur' && (                    case 'achat':

                    <SimplePlanner employes={employes} projets={projets} setProjets={setProjets} />                        materiaux.push(

                )}                            { ...materiauxStandard.find(m => m.id === 'acier-inox-316l')! },

                {appActive === 'usine' && (                            { ...materiauxStandard.find(m => m.id === 'tole-acier-5mm')! },

                    <UsineGame />                            { ...materiauxStandard.find(m => m.id === 'moteur-brushless-24v')! },

                )}                            { ...materiauxStandard.find(m => m.id === 'carte-electronique-amr')! }

            </main>                        );

        </div>                        break;

    );                    case 'pre_assemblage_electrique':

}                    case 'assemblage_electrique_final':

                        materiaux.push(

export default App;                            { ...materiauxStandard.find(m => m.id === 'cable-electrique-awg12')! },
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
