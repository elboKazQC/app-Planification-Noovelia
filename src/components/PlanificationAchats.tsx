import { useState, useEffect } from 'react';
import { Projet, Alerte, MaterielProjet } from '../types';
import {
    genererAlertesAchat,
    calculerPlanningAchats,
    formaterDate,
    obtenirCouleurUrgence,
    PlanningAchat
} from '../utils/planificationMateriaux';
import CalendrierAchats from './CalendrierAchats';
import './PlanificationAchats.css';

interface PlanificationAchatsProps {
    projets: Projet[];
    setProjets: (projets: Projet[]) => void;
}

export default function PlanificationAchats({ projets, setProjets }: PlanificationAchatsProps) {
    const [alertes, setAlertes] = useState<Alerte[]>([]);
    const [planningAchats, setPlanningAchats] = useState<PlanningAchat[]>([]);
    const [ongletActif, setOngletActif] = useState<'alertes' | 'planning' | 'calendrier'>('alertes');
    const [edition, setEdition] = useState<{
        ouvert: boolean;
        projetId?: string;
        materiel?: MaterielProjet;
    }>({ ouvert: false });

    useEffect(() => {
        const nouvellesAlertes = genererAlertesAchat(projets);
        const nouveauPlanning = calculerPlanningAchats(projets);

        setAlertes(nouvellesAlertes);
        setPlanningAchats(nouveauPlanning);
    }, [projets]);

    // Synchroniser l'onglet via le hash de l'URL (#achats=...)
    useEffect(() => {
        const appliquerHash = () => {
            const hash = window.location.hash || '';
            const match = hash.match(/achats=(alertes|planning|calendrier)/);
            if (match) {
                setOngletActif(match[1] as any);
            }
        };
        appliquerHash();
        window.addEventListener('hashchange', appliquerHash);
        return () => window.removeEventListener('hashchange', appliquerHash);
    }, []);

    const alertesCritiques = alertes.filter(a => a.gravite === 'critique');
    const alertesAttention = alertes.filter(a => a.gravite === 'attention');
    const alertesInfo = alertes.filter(a => a.gravite === 'info');

    const planningUrgent = planningAchats.filter(p => p.urgence === 'critique');
    const planningAttention = planningAchats.filter(p => p.urgence === 'attention');
    const planningNormal = planningAchats.filter(p => p.urgence === 'normal');

    return (
        <div className="planification-achats">
            <div className="header-achats">
                <h2>🛒 Planification des Achats</h2>
                <div className="stats-achats">
                    <div className="stat-item critique">
                        <span className="stat-number">{alertesCritiques.length}</span>
                        <span className="stat-label">Urgents</span>
                    </div>
                    <div className="stat-item attention">
                        <span className="stat-number">{alertesAttention.length}</span>
                        <span className="stat-label">À prévoir</span>
                    </div>
                    <div className="stat-item normal">
                        <span className="stat-number">{planningNormal.length}</span>
                        <span className="stat-label">Futur</span>
                    </div>
                </div>
            </div>

            <div className="onglets-achats">
                <button
                    className={`onglet ${ongletActif === 'alertes' ? 'actif' : ''}`}
                    onClick={() => setOngletActif('alertes')}
                >
                    🚨 Alertes ({alertes.length})
                </button>
                <button
                    className={`onglet ${ongletActif === 'planning' ? 'actif' : ''}`}
                    onClick={() => setOngletActif('planning')}
                >
                    📅 Planning ({planningAchats.length})
                </button>
                <button
                    className={`onglet ${ongletActif === 'calendrier' ? 'actif' : ''}`}
                    onClick={() => setOngletActif('calendrier')}
                >
                    🗓️ Vue Calendrier
                </button>
            </div>

            <div className="contenu-achats">
                {ongletActif === 'alertes' && (
                    <div className="alertes-section">
                        {alertesCritiques.length > 0 && (
                            <div className="alertes-groupe critique">
                                <h3>🚨 Achats Urgents ({alertesCritiques.length})</h3>
                                {alertesCritiques.map(alerte => (
                                    <div
                                        key={alerte.id}
                                        className="alerte-card critique"
                                        onClick={() => setOngletActif('planning')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="alerte-header">
                                            <span className="alerte-titre">{alerte.message}</span>
                                            <span className="alerte-echeance">
                                                Échéance: {formaterDate(alerte.dateEcheance!)}
                                            </span>
                                        </div>
                                        <div className="alerte-action">
                                            <strong>Action:</strong> {alerte.actionRecommandee}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {alertesAttention.length > 0 && (
                            <div className="alertes-groupe attention">
                                <h3>⏰ Achats à Prévoir ({alertesAttention.length})</h3>
                                {alertesAttention.map(alerte => (
                                    <div
                                        key={alerte.id}
                                        className="alerte-card attention"
                                        onClick={() => setOngletActif('planning')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="alerte-header">
                                            <span className="alerte-titre">{alerte.message}</span>
                                            <span className="alerte-echeance">
                                                Échéance: {formaterDate(alerte.dateEcheance!)}
                                            </span>
                                        </div>
                                        <div className="alerte-action">
                                            <strong>Action:</strong> {alerte.actionRecommandee}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {alertesInfo.length > 0 && (
                            <div className="alertes-groupe info">
                                <h3>📝 Informations Futures ({alertesInfo.length})</h3>
                                {alertesInfo.slice(0, 5).map(alerte => (
                                    <div
                                        key={alerte.id}
                                        className="alerte-card info"
                                        onClick={() => setOngletActif('planning')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="alerte-header">
                                            <span className="alerte-titre">{alerte.message}</span>
                                            <span className="alerte-echeance">
                                                Échéance: {formaterDate(alerte.dateEcheance!)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {alertesInfo.length > 5 && (
                                    <div className="alerte-card info voir-plus">
                                        ... et {alertesInfo.length - 5} autres achats à prévoir
                                    </div>
                                )}
                            </div>
                        )}

                        {alertes.length === 0 && (
                            <div className="aucune-alerte">
                                <div className="icon">✅</div>
                                <h3>Aucune alerte d'achat</h3>
                                <p>Tous vos matériaux sont disponibles ou commandés à temps !</p>
                            </div>
                        )}
                    </div>
                )}

                {ongletActif === 'planning' && (
                    <div className="planning-section">
                        <div className="planning-tableau">
                            <div className="tableau-header">
                                <div>Matériel</div>
                                <div>Projet</div>
                                <div>Quantité</div>
                                <div>Stock</div>
                                <div>Date Commande</div>
                                <div>Jours Restants</div>
                                <div>Statut</div>
                            </div>

                            {[...planningUrgent, ...planningAttention, ...planningNormal.slice(0, 10)].map((item, index) => (
                                <div
                                    key={`${item.projet.id}-${item.materiel.id}-${index}`}
                                    className={`tableau-ligne ${item.urgence}`}
                                    onClick={() => setEdition({ ouvert: true, projetId: item.projet.id, materiel: item.materiel })}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="materiel-info">
                                        <strong>{item.materiel.nom}</strong>
                                        <small>{item.materiel.fournisseur}</small>
                                    </div>
                                    <div className="projet-info">
                                        <strong>{item.projet.nom}</strong>
                                        <small>Priorité: {item.projet.priorite}</small>
                                    </div>
                                    <div className="quantite">
                                        {item.materiel.quantite} {item.materiel.unite}
                                    </div>
                                    <div className="stock">
                                        <span className={item.materiel.enStock <= item.materiel.seuilAlerte ? 'stock-bas' : 'stock-ok'}>
                                            {item.materiel.enStock} {item.materiel.unite}
                                        </span>
                                    </div>
                                    <div className="date-commande">
                                        {formaterDate(item.dateCommandeOptimale)}
                                    </div>
                                    <div
                                        className="jours-restants"
                                        style={{ color: obtenirCouleurUrgence(item.joursRestants) }}
                                    >
                                        {item.joursRestants > 0 ? `${item.joursRestants}j` : `${Math.abs(item.joursRestants)}j retard`}
                                    </div>
                                    <div className="statut-materiel">
                                        <span className={`badge-statut ${item.materiel.statut}`}>
                                            {item.materiel.statut.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {planningAchats.length === 0 && (
                                <div className="tableau-ligne vide">
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
                                        <h3>Aucun achat planifié</h3>
                                        <p>Tous vos matériaux sont disponibles ou déjà commandés !</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {ongletActif === 'calendrier' && (
                    <div className="calendrier-section">
                        <CalendrierAchats projets={projets} />
                    </div>
                )}
            </div>

            {/* Modal d'édition du matériel */}
            {edition.ouvert && edition.projetId && edition.materiel && (
                <div className="modal-overlay" onClick={() => setEdition({ ouvert: false })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>✏️ Modifier le matériel</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget as HTMLFormElement);
                            const enStock = Number(formData.get('enStock')) || 0;
                            const statut = (formData.get('statut') as MaterielProjet['statut']);
                            const fournisseur = (formData.get('fournisseur') as string) || undefined;
                            const dateCmdStr = formData.get('dateCommandeOptimale') as string | null;
                            const dateCommandeOptimale = dateCmdStr ? new Date(dateCmdStr) : undefined;

                            const { projetId, materiel } = edition;
                            if (!projetId || !materiel) return;

                            // Mettre à jour le matériel dans le projet ciblé
                            const nouveauxProjets = projets.map(p => {
                                if (p.id !== projetId) return p;
                                return {
                                    ...p,
                                    etapes: p.etapes.map(etape => {
                                        if (!etape.materielRequis) return etape;
                                        return {
                                            ...etape,
                                            materielRequis: etape.materielRequis.map(m =>
                                                m.id === materiel.id ? {
                                                    ...m,
                                                    enStock,
                                                    statut,
                                                    fournisseur,
                                                    dateCommandeOptimale
                                                } : m
                                            )
                                        };
                                    })
                                };
                            });

                            setProjets(nouveauxProjets);
                            setEdition({ ouvert: false });
                        }}>
                            <div className="form-group">
                                <label>Nom</label>
                                <input type="text" value={edition.materiel.nom} readOnly />
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px' }}>
                                <div>
                                    <label>Fournisseur</label>
                                    <input name="fournisseur" type="text" defaultValue={edition.materiel.fournisseur || ''} />
                                </div>
                                <div>
                                    <label>Unité</label>
                                    <input type="text" value={edition.materiel.unite} readOnly />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label>Quantité requise</label>
                                    <input type="number" value={edition.materiel.quantite} readOnly />
                                </div>
                                <div>
                                    <label>En stock</label>
                                    <input name="enStock" type="number" min={0} defaultValue={edition.materiel.enStock} />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label>Statut</label>
                                    <select name="statut" defaultValue={edition.materiel.statut}>
                                        <option value="disponible">Disponible</option>
                                        <option value="a_commander">À commander</option>
                                        <option value="commande">Commandé</option>
                                        <option value="en_route">En route</option>
                                        <option value="recu">Reçu</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Date commande optimale</label>
                                    <input
                                        name="dateCommandeOptimale"
                                        type="date"
                                        defaultValue={edition.materiel.dateCommandeOptimale
                                            ? new Date(edition.materiel.dateCommandeOptimale).toISOString().split('T')[0]
                                            : ''}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setEdition({ ouvert: false })}>Annuler</button>
                                <button type="submit" className="btn-confirm">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
