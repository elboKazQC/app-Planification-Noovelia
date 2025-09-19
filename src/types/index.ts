// Compétences/métiers disponibles
export type Competence =
    | 'soudage'
    | 'assemblage'
    | 'electrique'
    | 'machinage'
    | 'coupe_materiel'
    | 'test_qualite'
    | 'test_logiciel'
    | 'achat';

// Étapes de production dans l'ordre logique
export type EtapeProduction =
    | 'achat'
    | 'coupe_materiel'
    | 'pre_assemblage_electrique'
    | 'soudage'
    | 'peinture_externe'
    | 'assemblage'
    | 'assemblage_electrique_final'
    | 'test_qualite'
    | 'test_logiciel';

// Statut d'une étape ou d'un projet
export type StatutTache =
    | 'en_attente'
    | 'en_cours'
    | 'termine'
    | 'bloque';

// Historique des changements d'état avec timestamps
export interface ChangementStatut {
    id: string;
    ancienStatut: StatutTache | null; // null pour le statut initial
    nouveauStatut: StatutTache;
    dateChangement: Date;
    utilisateur?: string; // Pour l'avenir si on ajoute la gestion des utilisateurs
    commentaire?: string;
}

// Données de temps réel pour une étape
export interface TempsReel {
    tempsTotal: number; // en minutes
    dateDebut?: Date;
    dateFin?: Date;
    tempsPause: number; // temps en pause/bloqué en minutes
    nbPauses: number;
}

// Gestion des dates d'arrivée de matériel
export interface DateArriveeMateriaux {
    projetId: string;
    datePreveArrivee: Date;
    dateCreation: Date;
    commentaire?: string;
}

// Employé avec ses compétences et disponibilité
export interface Employe {
    id: string;
    nom: string;
    competences: Competence[];
    heuresParSemaine: number; // 25, 35, ou 40h
    tauxHoraire?: number;
}

// Estimation de temps pour une étape spécifique
export interface EstimationEtape {
    id: string;
    etape: EtapeProduction;
    competenceRequise: Competence[];
    heuresEstimees: number;
    dependances?: string[]; // IDs des étapes qui doivent être terminées avant
    materielRequis?: MaterielProjet[]; // 🆕 Matériel requis pour cette étape
    statut: StatutTache;
    employeAffecte?: string; // 🆕 ID de l'employé affecté à cette étape

    // Nouveau : tracking temporel
    historiqueStatuts: ChangementStatut[];
    tempsReel?: TempsReel;
    dateCreation: Date;
}

// Projet/Commande AMR
export interface Projet {
    id: string;
    nom: string;
    description: string;
    dateCommande: Date;
    dateVoulue: Date;
    quantite: number;
    etapes: EstimationEtape[];
    statut: StatutTache;
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
}

// Affectation d'un employé à une tâche
export interface Affectation {
    id: string;
    employeId: string;
    projetId: string;
    etapeId: string;
    dateDebut: Date;
    dateFin: Date;
    heuresAllouees: number;
    statut: StatutTache;
}

// Planning global avec alertes
export interface PlanningStatus {
    chargeActuelle: Record<string, number>; // employeId -> heures utilisées cette semaine
    conflits: ConflitRessource[];
    alertes: Alerte[];
    projections: ProjectionFuture[];
}

// Conflit de ressources
export interface ConflitRessource {
    type: 'surcharge' | 'competence_manquante' | 'materiel_manquant';
    employeId?: string;
    projetId: string;
    etapeId: string;
    description: string;
    dateConstat: Date;
}

// Matériau requis pour un projet
export interface MaterielProjet {
    id: string;
    nom: string;
    quantite: number;
    unite: string; // 'kg', 'm', 'pcs', etc.
    fournisseur?: string;
    delaiLivraisonJours: number; // délai de livraison en jours (ex: 60 pour 2 mois)
    prix?: number;
    enStock: number; // quantité actuellement en stock
    seuilAlerte: number; // seuil en dessous duquel il faut commander
    dateCommandeOptimale?: Date; // calculée automatiquement
    statut: 'disponible' | 'a_commander' | 'commande' | 'en_route' | 'recu';
}

// Alerte système étendue
export interface Alerte {
    id: string;
    type: 'manque_personnel' | 'retard_projet' | 'materiel_manquant' | 'surcharge' | 'achat_urgent' | 'stock_bas';
    gravite: 'info' | 'attention' | 'critique';
    message: string;
    projetId?: string;
    employeId?: string;
    materielId?: string;
    dateCreation: Date;
    dateEcheance?: Date; // date limite pour résoudre l'alerte
    resolu: boolean;
    actionRecommandee?: string; // action suggérée pour résoudre l'alerte
}

// Projection future des besoins
export interface ProjectionFuture {
    semaine: Date;
    besoinPersonnel: Record<Competence, number>; // compétence -> heures nécessaires
    personnelDisponible: Record<Competence, number>; // compétence -> heures disponibles
    ecart: Record<Competence, number>; // besoin - disponible
    projetsEnCours: string[]; // IDs des projets actifs cette semaine
}

// Template d'heures par défaut pour une étape
export interface TemplateEtape {
    etape: EtapeProduction;
    competenceRequise: Competence[];
    heuresEstimees: number;
}

// Template de projet avec heures par défaut
export interface TemplateProjet {
    id: string;
    nom: string;
    type: 'AMR' | 'Accessoire';
    description: string;
    etapes: TemplateEtape[];
}

// ===== TYPES POUR LE KANBAN BOARD =====

// Types de véhicules et accessoires spécifiques
export type TypeVehicule =
    | 'AMR PL'
    | 'AMR FL'
    | 'AMR Uniboard'
    | 'AMR R&D'
    | 'Accessoire Uniboard'
    | 'Accessoire CSTE2010E';

// Colonnes du Kanban dans l'ordre du workflow
export type KanbanColumn =
    | 'nouveau_projet'
    | 'achat'
    | 'soudage'
    | 'machinage'
    | 'peinture'
    | 'assemblage'
    | 'electrique'
    | 'test'
    | 'termine';

// Niveaux de priorité
export type PrioriteNiveau = 'basse' | 'normale' | 'haute' | 'urgente';

// Historique des mouvements entre colonnes
export interface MouvementHistoire {
    id: string;
    projetId: string;
    colonneSource: KanbanColumn | null; // null pour création initiale
    colonneDestination: KanbanColumn;
    dateMovement: Date;
    utilisateur?: string;
    commentaire?: string;
}

// Projet Kanban avec informations spécifiques
export interface ProjetKanban {
    id: string;
    numero: string; // # du projet (ex: "AMR-2025-001")
    nom: string;
    typeVehicule: TypeVehicule;
    client: string;
    priorite: PrioriteNiveau;
    colonneActuelle: KanbanColumn;
    dateCreation: Date;
    dateModification: Date;
    description?: string;
    notes?: string;
    historiqueMovements: MouvementHistoire[];
    estArchive: boolean; // true quand terminé et archivé
    dateArchivage?: Date;
}

// État du Kanban Board
export interface KanbanState {
    projets: ProjetKanban[];
    projetsArchives: ProjetKanban[];
    colonnes: {
        [key in KanbanColumn]: {
            id: KanbanColumn;
            titre: string;
            couleur: string;
            projets: string[]; // IDs des projets dans cette colonne
        }
    };
}

// Configuration des colonnes avec metadata
export interface ConfigurationColonne {
    id: KanbanColumn;
    titre: string;
    couleur: string;
    icone?: string;
    description?: string;
    ordre: number;
}
