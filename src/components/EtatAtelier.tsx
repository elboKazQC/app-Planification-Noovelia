import { useMemo, useState } from 'react';
import { Projet, Employe, DateArriveeMateriaux, EtapeProduction } from '../types';
import './EtatAtelier.css';

interface EtatAtelierProps {
    projets: Projet[];
    employes: Employe[];
}

interface StatutAtelier {
    soudage: {
        projetsDisponibles: number;
        materielManquant: string[];
        peutTravailler: boolean;
    };
    assemblage: {
        projetsDisponibles: number;
        peutTravailler: boolean;
    };
    electrique: {
        projetsEnCours: number;
        semainesRestantes: number;
        peutTravailler: boolean;
        bloque: string[];
    };
    alertes: { message: string, type: string, projets?: Projet[] }[];
}

export default function EtatAtelier({ projets, employes }: EtatAtelierProps) {
    console.log('EtatAtelier rendu avec:', { projetsCount: projets.length, employesCount: employes.length });

    // État pour gérer les dates d'arrivée de matériel
    const [datesArrivee, setDatesArrivee] = useState<DateArriveeMateriaux[]>(() => {
        const saved = localStorage.getItem('noovelia-dates-arrivee');
        if (saved) {
            try {
                return JSON.parse(saved, (key, value) => {
                    if (key === 'datePreveArrivee' || key === 'dateCreation') {
                        return value ? new Date(value) : value;
                    }
                    return value;
                });
            } catch (error) {
                console.error('Erreur lors du chargement des dates d\'arrivée:', error);
                return [];
            }
        }
        return [];
    });

    // État pour le modal
    const [modalDate, setModalDate] = useState<{
        isOpen: boolean,
        projetsDisponibles?: Projet[],
        projetSelectionne?: string,
        commentaireDefaut?: string
    }>({
        isOpen: false
    });

    // Sauvegarder les dates d'arrivée
    const sauvegarderDatesArrivee = (nouvelleDates: DateArriveeMateriaux[]) => {
        setDatesArrivee(nouvelleDates);
        localStorage.setItem('noovelia-dates-arrivee', JSON.stringify(nouvelleDates));
    };

    // Ajouter/modifier une date d'arrivée
    const definirDateArrivee = (projetId: string, dateArrivee: Date, commentaire?: string) => {
        const nouvelleDate: DateArriveeMateriaux = {
            projetId,
            datePreveArrivee: dateArrivee,
            dateCreation: new Date(),
            commentaire
        };

        const nouvellesDates = datesArrivee.filter(d => d.projetId !== projetId);
        nouvellesDates.push(nouvelleDate);
        sauvegarderDatesArrivee(nouvellesDates);
        setModalDate({ isOpen: false });
    };

    const etatAtelier = useMemo((): StatutAtelier => {
        console.log('Calcul de l\'état atelier...');

        // Ordre des étapes pour vérifier la disponibilité réelle d'une étape
        const ordreEtapes: EtapeProduction[] = [
            'achat',
            'coupe_materiel',
            'pre_assemblage_electrique',
            'soudage',
            'peinture_externe',
            'assemblage',
            'assemblage_electrique_final',
            'test_qualite',
            'test_logiciel'
        ];

        const precedentesTerminees = (projet: Projet, cible: EtapeProduction) => {
            const idx = ordreEtapes.indexOf(cible);
            if (idx <= 0) return true;
            // Toutes les étapes précédentes (ayant des heures) doivent être terminées
            return projet.etapes
                .filter(e => ordreEtapes.indexOf(e.etape) > -1 && ordreEtapes.indexOf(e.etape) < idx && e.heuresEstimees > 0)
                .every(e => e.statut === 'termine');
        };

        // Analyser les projets par étape
        const projetsSoudage = projets.filter(p =>
            p.etapes.some(e => e.etape === 'soudage' && e.statut === 'en_attente') &&
            p.etapes.some(e => e.etape === 'achat' && e.statut === 'termine')
        );

        const projetsAssemblage = projets.filter(p => {
            const etapeAsm = p.etapes.find(e => e.etape === 'assemblage');
            if (!etapeAsm) return false;
            const statutOK = etapeAsm.statut === 'en_attente' || etapeAsm.statut === 'en_cours';
            if (!statutOK) return false;
            // ✅ Assemblage disponible seulement si toutes les étapes précédentes (dont peinture) sont terminées
            return precedentesTerminees(p, 'assemblage');
        });

        const projetsElectrique = projets.filter(p =>
            p.etapes.some(e =>
                (e.etape === 'pre_assemblage_electrique' || e.etape === 'assemblage_electrique_final') &&
                (e.statut === 'en_cours' || e.statut === 'en_attente')
            )
        );

        const projetsBloquesElectrique = projets.filter(p =>
            p.etapes.some(e =>
                (e.etape === 'pre_assemblage_electrique' || e.etape === 'assemblage_electrique_final') &&
                e.statut === 'bloque'
            )
        );

        // Projets avec pré-assemblage électrique en attente à cause du stock manquant
        const projetsPreElecManqueStock = projets.filter(p => {
            const etape = p.etapes.find(e => e.etape === 'pre_assemblage_electrique' && e.statut === 'en_attente');
            if (!etape) return false;
            if (!etape.materielRequis || etape.materielRequis.length === 0) return false;
            return etape.materielRequis.some(m => (m.enStock < m.quantite) && m.statut !== 'recu' && m.statut !== 'disponible');
        });

        // Calculer les semaines restantes d'électrique
        const heuresElectriqueRestantes = projetsElectrique.reduce((total, projet) => {
            return total + projet.etapes
                .filter(e =>
                    (e.etape === 'pre_assemblage_electrique' || e.etape === 'assemblage_electrique_final') &&
                    e.statut !== 'termine'
                )
                .reduce((sum, etape) => sum + etape.heuresEstimees, 0);
        }, 0);

        const heuresElectriqueDisponibles = employes
            .filter(e => e.competences.includes('electrique'))
            .reduce((total, emp) => total + emp.heuresParSemaine, 0);

        const semainesRestantes = heuresElectriqueDisponibles > 0
            ? Math.ceil(heuresElectriqueRestantes / heuresElectriqueDisponibles)
            : 0;

        // Identifier les matériaux manquants
        const materielManquant: string[] = [];
        projetsSoudage.forEach(projet => {
            const etapeAchat = projet.etapes.find(e => e.etape === 'achat');
            if (etapeAchat?.statut !== 'termine') {
                materielManquant.push(`Matériel pour ${projet.nom}`);
            }
        });

        // Projets en attente d'achat
        const projetsAttenteAchat = projets.filter(p =>
            p.etapes.some(e => e.etape === 'achat' && (e.statut === 'en_attente' || e.statut === 'en_cours'))
        );

        // Générer les alertes avec informations sur les projets
        const alertes: { message: string, type: string, projets?: Projet[] }[] = [];

        if (projetsSoudage.length === 0 && projetsAttenteAchat.length > 0) {
            alertes.push({
                message: `🚨 URGENT: ${projetsAttenteAchat.length} projets en attente de matériel - Soudage arrêté`,
                type: 'urgent',
                projets: projetsAttenteAchat
            });
        }

        if (projetsAssemblage.length === 0) {
            alertes.push({
                message: `⚠️ Plus de projets prêts pour l'assemblage`,
                type: 'attention'
            });
        }

        if (semainesRestantes <= 3 && semainesRestantes > 0) {
            alertes.push({
                message: `⏰ Plus que ${semainesRestantes} semaines de travail électrique`,
                type: 'attention'
            });
        }

        if (projetsBloquesElectrique.length > 0) {
            alertes.push({
                message: `🔴 ${projetsBloquesElectrique.length} projets bloqués à l'électrique`,
                type: 'attention'
            });
        }

        // Alerte: stock manquant pour le pré-assemblage électrique
        if (projetsPreElecManqueStock.length > 0) {
            alertes.push({
                message: `⚠️ Stock manquant pour le pré-assemblage électrique (${projetsPreElecManqueStock.length} projets)`,
                type: 'attention',
                projets: projetsPreElecManqueStock
            });
        }

        if (projetsSoudage.length === 0 && projetsAssemblage.length === 0 && projetsElectrique.length <= 2) {
            alertes.push({
                message: `🚨 CRITIQUE: Risque de manque de travail dans ${semainesRestantes} semaines`,
                type: 'critique'
            });
        }

        return {
            soudage: {
                projetsDisponibles: projetsSoudage.length,
                materielManquant,
                peutTravailler: projetsSoudage.length > 0
            },
            assemblage: {
                projetsDisponibles: projetsAssemblage.length,
                peutTravailler: projetsAssemblage.length > 0
            },
            electrique: {
                projetsEnCours: projetsElectrique.length,
                semainesRestantes,
                peutTravailler: projetsElectrique.length > 0,
                bloque: projetsBloquesElectrique.map(p => p.nom)
            },
            alertes
        };
    }, [projets, employes]);

    // Auto-prompt: demander la date d'arrivée quand le soudage est arrêté (en attente d'achats)
    useMemo(() => {
        try {
            // Recalculer les projets en attente d'achat
            const projetsAttenteAchat = projets.filter(p =>
                p.etapes.some(e => e.etape === 'achat' && (e.statut === 'en_attente' || e.statut === 'en_cours'))
            );
            const askedRaw = localStorage.getItem('noovelia-asked-soudage-ids') || '[]';
            const asked: string[] = JSON.parse(askedRaw);
            const nonAskes = projetsAttenteAchat.filter(p => !asked.includes(p.id));

            if (!etatAtelier.soudage.peutTravailler && nonAskes.length > 0) {
                setModalDate({ isOpen: true, projetsDisponibles: nonAskes, projetSelectionne: nonAskes[0].id, commentaireDefaut: 'Arrivée stock pour soudage' });
                // Marquer comme demandé pour ne pas re-popup en boucle
                localStorage.setItem('noovelia-asked-soudage-ids', JSON.stringify([...asked, ...nonAskes.map(p => p.id)]));
            }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [etatAtelier.soudage.peutTravailler, projets]);

    // Auto-prompt: demander la date d'arrivée pour le pré-assemblage électrique si stock manquant
    useMemo(() => {
        try {
            const projetsPreElecManqueStock = projets.filter(p => {
                const etape = p.etapes.find(e => e.etape === 'pre_assemblage_electrique' && e.statut === 'en_attente');
                if (!etape) return false;
                if (!etape.materielRequis || etape.materielRequis.length === 0) return false;
                return etape.materielRequis.some(m => (m.enStock < m.quantite) && m.statut !== 'recu' && m.statut !== 'disponible');
            });
            const askedRaw = localStorage.getItem('noovelia-asked-pre-elec-ids') || '[]';
            const asked: string[] = JSON.parse(askedRaw);
            const nonAskes = projetsPreElecManqueStock.filter(p => !asked.includes(p.id));
            if (nonAskes.length > 0) {
                setModalDate({ isOpen: true, projetsDisponibles: nonAskes, projetSelectionne: nonAskes[0].id, commentaireDefaut: 'Arrivée stock pour pré-assemblage électrique' });
                localStorage.setItem('noovelia-asked-pre-elec-ids', JSON.stringify([...asked, ...nonAskes.map(p => p.id)]));
            }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projets]);

    return (
        <div className="etat-atelier">
            <div className="header-atelier">
                <h2>🏭 État de l'Atelier - Temps Réel</h2>
                <div className="date-maj">
                    Mise à jour: {new Date().toLocaleString('fr-FR')}
                </div>
            </div>

            {/* Alertes prioritaires */}
            {etatAtelier.alertes.length > 0 && (
                <div className="alertes-critiques">
                    <h3>🚨 Alertes Prioritaires</h3>
                    {etatAtelier.alertes.map((alerte, index) => (
                        <div
                            key={index}
                            className={`alerte-item ${alerte.type}`}
                            onClick={() => {
                                if (alerte.projets) {
                                    // Filtrer les projets qui ont besoin de matériel
                                    const projetsNecessitantMateriel = alerte.projets.filter(p =>
                                        p.etapes.some(e => e.etape === 'achat' && (e.statut === 'en_attente' || e.statut === 'en_cours'))
                                    );
                                    if (projetsNecessitantMateriel.length > 0) {
                                        setModalDate({
                                            isOpen: true,
                                            projetsDisponibles: projetsNecessitantMateriel,
                                            projetSelectionne: projetsNecessitantMateriel[0].id // Sélectionner le premier par défaut
                                        });
                                    }
                                }
                            }}
                            style={alerte.projets ? { cursor: 'pointer' } : {}}
                        >
                            {alerte.message}
                            {alerte.projets && (
                                <div className="projets-details">
                                    <small>📋 Projets concernés:</small>
                                    {alerte.projets.slice(0, 3).map(projet => {
                                        const dateArrivee = datesArrivee.find(d => d.projetId === projet.id);
                                        return (
                                            <div key={projet.id} className="projet-mini">
                                                • {projet.nom}
                                                {dateArrivee && (
                                                    <span className="date-prevue">
                                                        (Arrivée prévue: {dateArrivee.datePreveArrivee.toLocaleDateString('fr-FR')})
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {alerte.projets.length > 3 && (
                                        <div className="plus-projets">... et {alerte.projets.length - 3} autres</div>
                                    )}
                                    <div className="click-hint">💡 Cliquez pour définir une date d'arrivée</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Statut par département */}
            <div className="departements">
                {/* Soudage */}
                <div className={`departement ${etatAtelier.soudage.peutTravailler ? 'actif' : 'arrete'}`}>
                    <div className="dept-header">
                        <div className="dept-icon">🔥</div>
                        <div className="dept-info">
                            <h3>Soudage</h3>
                            <div className="dept-status">
                                {etatAtelier.soudage.peutTravailler ? 'ACTIF' : 'ARRÊTÉ'}
                            </div>
                        </div>
                        <div className="dept-projets">
                            {etatAtelier.soudage.projetsDisponibles} projets
                        </div>
                    </div>

                    {!etatAtelier.soudage.peutTravailler && (
                        <div className="dept-details">
                            <div className="probleme">
                                ❌ <strong>Raison de l'arrêt:</strong> Matériel manquant
                            </div>
                            <div className="action-requise">
                                ✅ <strong>Action:</strong> Commander matériel pour projets en attente d'achat
                            </div>
                        </div>
                    )}
                </div>

                {/* Assemblage */}
                <div className={`departement ${etatAtelier.assemblage.peutTravailler ? 'actif' : 'arrete'}`}>
                    <div className="dept-header">
                        <div className="dept-icon">🔧</div>
                        <div className="dept-info">
                            <h3>Assemblage</h3>
                            <div className="dept-status">
                                {etatAtelier.assemblage.peutTravailler ? 'ACTIF' : 'ARRÊTÉ'}
                            </div>
                        </div>
                        <div className="dept-projets">
                            {etatAtelier.assemblage.projetsDisponibles} projets
                        </div>
                    </div>

                    {!etatAtelier.assemblage.peutTravailler && (
                        <div className="dept-details">
                            <div className="probleme">
                                ❌ <strong>Raison de l'arrêt:</strong> Tous les projets terminés
                            </div>
                            <div className="action-requise">
                                ✅ <strong>Action:</strong> Attendre que le soudage termine des projets
                            </div>
                        </div>
                    )}
                </div>

                {/* Électrique */}
                <div className={`departement ${etatAtelier.electrique.peutTravailler ? 'actif' : 'arrete'}`}>
                    <div className="dept-header">
                        <div className="dept-icon">⚡</div>
                        <div className="dept-info">
                            <h3>Électrique</h3>
                            <div className="dept-status">
                                {etatAtelier.electrique.peutTravailler ? 'ACTIF' : 'ARRÊTÉ'}
                            </div>
                        </div>
                        <div className="dept-projets">
                            {etatAtelier.electrique.projetsEnCours} projets
                        </div>
                    </div>

                    <div className="dept-details">
                        {etatAtelier.electrique.semainesRestantes > 0 ? (
                            <>
                                <div className="temps-restant">
                                    ⏰ <strong>Temps restant:</strong> ~{etatAtelier.electrique.semainesRestantes} semaines
                                </div>
                                {etatAtelier.electrique.semainesRestantes <= 3 && (
                                    <div className="action-requise">
                                        ⚠️ <strong>Attention:</strong> Prévoir travail pour après l'électrique
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="probleme">
                                ❌ Plus de travail électrique disponible
                            </div>
                        )}

                        {etatAtelier.electrique.bloque.length > 0 && (
                            <div className="projets-bloques">
                                🔴 <strong>Projets bloqués:</strong> {etatAtelier.electrique.bloque.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions recommandées */}
            {(() => {
                const showPlanifier = etatAtelier.electrique.semainesRestantes <= 3 && etatAtelier.electrique.semainesRestantes > 0;
                const showOk = etatAtelier.soudage.peutTravailler && etatAtelier.assemblage.peutTravailler;
                const hasAny = showPlanifier || showOk;
                if (!hasAny) return null;
                return (
                    <div className="actions-recommandees">
                        <h3>💡 Actions Recommandées</h3>
                        <div className="actions-grid">

                            {showPlanifier && (
                                <div className="action-card attention">
                                    <div className="action-icon">📅</div>
                                    <div className="action-content">
                                        <h4>Planifier Prochains Projets</h4>
                                        <p>Plus que {etatAtelier.electrique.semainesRestantes} semaines d'électrique</p>
                                        <button
                                            className="action-btn"
                                            onClick={() => {
                                                window.location.hash = 'achats=calendrier';
                                                const section = document.querySelector('.planification-achats');
                                                if (section) section.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            Voir planning
                                        </button>
                                    </div>
                                </div>
                            )}

                            {showOk && (
                                <div className="action-card normal">
                                    <div className="action-icon">✅</div>
                                    <div className="action-content">
                                        <h4>Tout va bien</h4>
                                        <p>Tous les départements ont du travail</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Modal pour définir la date d'arrivée */}
            {modalDate.isOpen && (
                <div className="modal-overlay" onClick={() => setModalDate({ isOpen: false })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>📅 Date d'arrivée prévue du matériel</h3>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const projetId = formData.get('projetSelectionne') as string;
                            const date = new Date(formData.get('dateArrivee') as string);
                            const commentaire = formData.get('commentaire') as string;

                            if (projetId) {
                                definirDateArrivee(projetId, date, commentaire);
                            }
                        }}>
                            <div className="form-group">
                                <label htmlFor="projetSelectionne">Sélectionner le projet:</label>
                                <select
                                    id="projetSelectionne"
                                    name="projetSelectionne"
                                    required
                                    value={modalDate.projetSelectionne || ''}
                                    onChange={(e) => setModalDate(prev => ({ ...prev, projetSelectionne: e.target.value }))}
                                    className="project-select"
                                >
                                    {modalDate.projetsDisponibles?.map(projet => (
                                        <option key={projet.id} value={projet.id}>
                                            {projet.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="dateArrivee">Date d'arrivée prévue:</label>
                                <input
                                    type="date"
                                    id="dateArrivee"
                                    name="dateArrivee"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="commentaire">Commentaire (optionnel):</label>
                                <textarea
                                    id="commentaire"
                                    name="commentaire"
                                    placeholder="Ex: Commandé chez fournisseur X, délai 2 semaines..."
                                    defaultValue={modalDate.commentaireDefaut || ''}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setModalDate({ isOpen: false })}
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn-confirm">
                                    Confirmer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
