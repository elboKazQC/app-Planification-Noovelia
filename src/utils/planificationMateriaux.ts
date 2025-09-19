import { Projet, EstimationEtape, MaterielProjet, Alerte } from '../types';

/**
 * Calcule la date optimale pour commander le matériel d'un projet
 * en tenant compte du délai de 2 mois standard et des délais fournisseurs
 */
export function calculerDateCommandeOptimale(
    projet: Projet,
    materiel: MaterielProjet
): Date {
    // Trouver la date de début estimée du soudage
    const etapeSoudage = projet.etapes.find(e => e.etape === 'soudage');
    if (!etapeSoudage) {
        // Si pas d'étape soudage, utiliser la date de début du projet + délais cumulés
        return new Date(projet.dateCommande.getTime() - (materiel.delaiLivraisonJours * 24 * 60 * 60 * 1000));
    }

    // Calculer la date estimée de début du soudage
    let dateDebutSoudage = new Date(projet.dateCommande);

    // Ajouter les délais des étapes précédant le soudage
    for (const etape of projet.etapes) {
        if (etape.etape === 'soudage') break;
        if (etape.heuresEstimees > 0) {
            // Convertir les heures en jours (8h par jour)
            const jours = Math.ceil(etape.heuresEstimees / 8);
            dateDebutSoudage = new Date(dateDebutSoudage.getTime() + (jours * 24 * 60 * 60 * 1000));
        }
    }

    // Soustraire le délai de livraison du fournisseur + marge de sécurité (7 jours)
    const margeSecurite = 7;
    const dateCommandeOptimale = new Date(
        dateDebutSoudage.getTime() - ((materiel.delaiLivraisonJours + margeSecurite) * 24 * 60 * 60 * 1000)
    );

    return dateCommandeOptimale;
}

/**
 * Génère les alertes d'achat pour tous les projets
 */
export function genererAlertesAchat(projets: Projet[]): Alerte[] {
    const alertes: Alerte[] = [];
    const maintenant = new Date();

    for (const projet of projets) {
        // Ignorer les projets terminés
        if (projet.statut === 'termine') continue;

        for (const etape of projet.etapes) {
            if (!etape.materielRequis || etape.materielRequis.length === 0) continue;

            for (const materiel of etape.materielRequis) {
                const dateCommandeOptimale = calculerDateCommandeOptimale(projet, materiel);
                const joursRestants = Math.ceil((dateCommandeOptimale.getTime() - maintenant.getTime()) / (24 * 60 * 60 * 1000));

                // Stock insuffisant
                if (materiel.enStock < materiel.quantite && materiel.enStock <= materiel.seuilAlerte) {
                    let gravite: 'info' | 'attention' | 'critique' = 'info';
                    let message = '';

                    if (joursRestants <= 0) {
                        gravite = 'critique';
                        message = `🚨 URGENT: Commande de ${materiel.nom} en retard de ${Math.abs(joursRestants)} jours pour ${projet.nom}!`;
                    } else if (joursRestants <= 7) {
                        gravite = 'critique';
                        message = `⚠️ URGENT: Commande de ${materiel.nom} nécessaire dans ${joursRestants} jours pour ${projet.nom}`;
                    } else if (joursRestants <= 14) {
                        gravite = 'attention';
                        message = `⏰ Attention: Commande de ${materiel.nom} nécessaire dans ${joursRestants} jours pour ${projet.nom}`;
                    } else if (joursRestants <= 30) {
                        gravite = 'info';
                        message = `📝 Info: Prévoir commande de ${materiel.nom} dans ${joursRestants} jours pour ${projet.nom}`;
                    }

                    if (message) {
                        alertes.push({
                            id: `achat-${projet.id}-${materiel.id}`,
                            type: joursRestants <= 7 ? 'achat_urgent' : 'stock_bas',
                            gravite,
                            message,
                            projetId: projet.id,
                            materielId: materiel.id,
                            dateCreation: maintenant,
                            dateEcheance: dateCommandeOptimale,
                            resolu: false,
                            actionRecommandee: `Commander ${materiel.quantite - materiel.enStock} ${materiel.unite} de ${materiel.nom} auprès de ${materiel.fournisseur || 'fournisseur habituel'}`
                        });

                        // 🔗 Alerte contextuelle: si le matériel est lié au pré-assemblage électrique
                        if (etape.etape === 'pre_assemblage_electrique') {
                            alertes.push({
                                id: `pre-elec-${projet.id}-${materiel.id}`,
                                type: 'materiel_manquant',
                                gravite: gravite === 'critique' ? 'critique' : 'attention',
                                message: `Pré-assemblage électrique bloqué: ${materiel.nom} insuffisant pour ${projet.nom}`,
                                projetId: projet.id,
                                materielId: materiel.id,
                                dateCreation: maintenant,
                                dateEcheance: dateCommandeOptimale,
                                resolu: false,
                                actionRecommandee: `Assurer disponibilité de ${materiel.nom} avant le démarrage du pré-assemblage électrique`
                            });
                        }
                    }
                }
            }
        }
    }

    return alertes;
}

/**
 * Calcule le planning des achats pour les prochains mois
 */
export interface PlanningAchat {
    materiel: MaterielProjet;
    projet: Projet;
    etape: EstimationEtape;
    dateCommandeOptimale: Date;
    urgence: 'critique' | 'attention' | 'normal';
    joursRestants: number;
}

export function calculerPlanningAchats(projets: Projet[]): PlanningAchat[] {
    const planning: PlanningAchat[] = [];
    const maintenant = new Date();

    for (const projet of projets) {
        if (projet.statut === 'termine') continue;

        for (const etape of projet.etapes) {
            if (!etape.materielRequis || etape.materielRequis.length === 0) continue;

            for (const materiel of etape.materielRequis) {
                if (materiel.statut === 'recu' || materiel.statut === 'disponible') continue;

                const dateCommandeOptimale = calculerDateCommandeOptimale(projet, materiel);
                const joursRestants = Math.ceil((dateCommandeOptimale.getTime() - maintenant.getTime()) / (24 * 60 * 60 * 1000));

                let urgence: 'critique' | 'attention' | 'normal' = 'normal';
                if (joursRestants <= 7) {
                    urgence = 'critique';
                } else if (joursRestants <= 30) {
                    urgence = 'attention';
                }

                planning.push({
                    materiel,
                    projet,
                    etape,
                    dateCommandeOptimale,
                    urgence,
                    joursRestants
                });
            }
        }
    }

    // Trier par urgence puis par date
    return planning.sort((a, b) => {
        const urgenceOrder = { critique: 0, attention: 1, normal: 2 };
        if (urgenceOrder[a.urgence] !== urgenceOrder[b.urgence]) {
            return urgenceOrder[a.urgence] - urgenceOrder[b.urgence];
        }
        return a.dateCommandeOptimale.getTime() - b.dateCommandeOptimale.getTime();
    });
}

/**
 * Formate une date en français
 */
export function formaterDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Calcule la couleur d'urgence basée sur les jours restants
 */
export function obtenirCouleurUrgence(joursRestants: number): string {
    if (joursRestants <= 0) return '#dc3545'; // Rouge critique
    if (joursRestants <= 7) return '#fd7e14'; // Orange urgent
    if (joursRestants <= 30) return '#ffc107'; // Jaune attention
    return '#28a745'; // Vert normal
}
