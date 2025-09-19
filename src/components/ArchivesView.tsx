import React, { useState } from 'react';
import { ProjetKanban, KanbanColumn, TypeVehicule } from '../types';
import './ArchivesView.css';

interface Props {
    projetsArchives: ProjetKanban[];
    onClose: () => void;
    onRestoreProject?: (projetId: string) => void;
}

const ArchivesView: React.FC<Props> = ({ projetsArchives, onClose, onRestoreProject }) => {
    const [filtreType, setFiltreType] = useState<TypeVehicule | 'tous'>('tous');
    const [filtreClient, setFiltreClient] = useState('');
    const [projetSelectionne, setProjetSelectionne] = useState<ProjetKanban | null>(null);
    const [sortBy, setSortBy] = useState<'date_archivage' | 'date_creation' | 'client' | 'type'>('date_archivage');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Filtrer les projets
    const projetsFiltres = projetsArchives.filter(projet => {
        const matchType = filtreType === 'tous' || projet.typeVehicule === filtreType;
        const matchClient = !filtreClient ||
            projet.client.toLowerCase().includes(filtreClient.toLowerCase()) ||
            projet.nom.toLowerCase().includes(filtreClient.toLowerCase()) ||
            projet.numero.toLowerCase().includes(filtreClient.toLowerCase());

        return matchType && matchClient;
    });

    // Trier les projets
    const projetsTries = [...projetsFiltres].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
            case 'date_archivage':
                aValue = a.dateArchivage?.getTime() || 0;
                bValue = b.dateArchivage?.getTime() || 0;
                break;
            case 'date_creation':
                aValue = a.dateCreation.getTime();
                bValue = b.dateCreation.getTime();
                break;
            case 'client':
                aValue = a.client.toLowerCase();
                bValue = b.client.toLowerCase();
                break;
            case 'type':
                aValue = a.typeVehicule;
                bValue = b.typeVehicule;
                break;
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // Calculer les statistiques
    const stats = {
        total: projetsArchives.length,
        parType: projetsArchives.reduce((acc, p) => {
            acc[p.typeVehicule] = (acc[p.typeVehicule] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        parMois: projetsArchives.reduce((acc, p) => {
            if (p.dateArchivage) {
                const mois = p.dateArchivage.toISOString().substring(0, 7);
                acc[mois] = (acc[mois] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>)
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculerDureeProduction = (projet: ProjetKanban) => {
        if (!projet.dateArchivage) return 'N/A';

        const dureeMs = projet.dateArchivage.getTime() - projet.dateCreation.getTime();
        const jours = Math.floor(dureeMs / (1000 * 60 * 60 * 24));

        if (jours === 0) return 'Moins d\'1 jour';
        if (jours === 1) return '1 jour';
        return `${jours} jours`;
    };

    // Obtenir les types uniques pour le filtre
    const typesUniques: TypeVehicule[] = Array.from(new Set(projetsArchives.map(p => p.typeVehicule))).sort() as TypeVehicule[];

    return (
        <div className="archives-view">
            <div className="archives-header">
                <div className="header-title">
                    <h1>📁 Archives des Projets Terminés</h1>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                {/* Statistiques */}
                <div className="archives-stats">
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Projets terminés</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{Object.keys(stats.parType).length}</div>
                        <div className="stat-label">Types différents</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{Object.keys(stats.parMois).length}</div>
                        <div className="stat-label">Mois actifs</div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="archives-filtres">
                <div className="filtre-group">
                    <label>Type de véhicule:</label>
                    <select value={filtreType} onChange={e => setFiltreType(e.target.value as TypeVehicule | 'tous')}>
                        <option value="tous">Tous les types</option>
                        {typesUniques.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="filtre-group">
                    <label>Rechercher:</label>
                    <input
                        type="text"
                        placeholder="Client, nom du projet, numéro..."
                        value={filtreClient}
                        onChange={e => setFiltreClient(e.target.value)}
                    />
                </div>

                <div className="filtre-group">
                    <label>Trier par:</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                        <option value="date_archivage">Date d'archivage</option>
                        <option value="date_creation">Date de création</option>
                        <option value="client">Client</option>
                        <option value="type">Type</option>
                    </select>
                    <button
                        className="sort-order-btn"
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            {/* Liste des projets archivés */}
            <div className="archives-content">
                <div className="projets-archives">
                    {projetsTries.length > 0 ? (
                        projetsTries.map(projet => (
                            <div key={projet.id} className="projet-archive-card">
                                <div className="card-header">
                                    <div className="projet-info">
                                        <h3>{projet.numero} - {projet.nom}</h3>
                                        <span className="type-badge" data-type={projet.typeVehicule}>
                                            {projet.typeVehicule}
                                        </span>
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="btn-voir-historique"
                                            onClick={() => setProjetSelectionne(projet)}
                                        >
                                            📈 Historique
                                        </button>
                                        {onRestoreProject && (
                                            <button
                                                className="btn-restaurer"
                                                onClick={() => onRestoreProject(projet.id)}
                                                title="Remettre en production"
                                            >
                                                🔄 Restaurer
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card-details">
                                    <div className="detail-item">
                                        <strong>Client:</strong> {projet.client}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Créé le:</strong> {formatDate(projet.dateCreation)}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Terminé le:</strong> {projet.dateArchivage ? formatDate(projet.dateArchivage) : 'N/A'}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Durée totale:</strong> {calculerDureeProduction(projet)}
                                    </div>
                                    <div className="detail-item">
                                        <strong>Étapes traversées:</strong> {projet.historiqueMovements.length - 1}/8
                                    </div>
                                </div>

                                {projet.description && (
                                    <div className="card-description">
                                        <strong>Description:</strong> {projet.description}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <div className="no-results-icon">🔍</div>
                            <h3>Aucun projet trouvé</h3>
                            <p>Essayez de modifier les filtres de recherche</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal d'historique détaillé */}
            {projetSelectionne && (
                <ProjectHistoryModal
                    projet={projetSelectionne}
                    onClose={() => setProjetSelectionne(null)}
                />
            )}
        </div>
    );
};

// Modal pour afficher l'historique détaillé d'un projet
interface HistoryModalProps {
    projet: ProjetKanban;
    onClose: () => void;
}

const ProjectHistoryModal: React.FC<HistoryModalProps> = ({ projet, onClose }) => {
    const colonneLabels: Record<KanbanColumn, string> = {
        nouveau_projet: 'Nouveau Projet',
        achat: 'Achat',
        soudage: 'Soudage',
        machinage: 'Machinage',
        peinture: 'Peinture',
        assemblage: 'Assemblage',
        electrique: 'Électrique',
        test: 'Test',
        termine: 'Terminé'
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculerTempsEtape = (index: number) => {
        if (index >= projet.historiqueMovements.length - 1) return null;

        const current = projet.historiqueMovements[index];
        const next = projet.historiqueMovements[index + 1];

        const dureeMs = next.dateMovement.getTime() - current.dateMovement.getTime();
        const jours = Math.floor(dureeMs / (1000 * 60 * 60 * 24));
        const heures = Math.floor((dureeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((dureeMs % (1000 * 60 * 60)) / (1000 * 60));

        if (jours > 0) return `${jours}j ${heures}h`;
        if (heures > 0) return `${heures}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📈 Historique - {projet.numero}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="projet-summary">
                        <h3>{projet.nom}</h3>
                        <div className="summary-details">
                            <span><strong>Client:</strong> {projet.client}</span>
                            <span><strong>Type:</strong> {projet.typeVehicule}</span>
                            <span><strong>Durée totale:</strong> {calculerDureeProduction(projet)}</span>
                        </div>
                    </div>

                    <div className="timeline">
                        {projet.historiqueMovements.map((mouvement, index) => {
                            const tempsEtape = calculerTempsEtape(index);
                            const isLast = index === projet.historiqueMovements.length - 1;

                            return (
                                <div key={mouvement.id} className="timeline-item">
                                    <div className="timeline-marker">
                                        <div className="marker-dot" />
                                        {!isLast && <div className="marker-line" />}
                                    </div>

                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <h4>{colonneLabels[mouvement.colonneDestination]}</h4>
                                            <span className="timeline-date">
                                                {formatDate(mouvement.dateMovement)}
                                            </span>
                                        </div>

                                        {mouvement.colonneSource && (
                                            <p className="timeline-transition">
                                                Depuis: {colonneLabels[mouvement.colonneSource]}
                                            </p>
                                        )}

                                        {tempsEtape && (
                                            <p className="timeline-duration">
                                                Temps dans cette étape: <strong>{tempsEtape}</strong>
                                            </p>
                                        )}

                                        {mouvement.commentaire && (
                                            <p className="timeline-comment">
                                                💬 {mouvement.commentaire}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fonction utilitaire (déplacée ici depuis le composant principal)
const calculerDureeProduction = (projet: ProjetKanban): string => {
    if (!projet.dateArchivage) return 'N/A';

    const dureeMs = projet.dateArchivage.getTime() - projet.dateCreation.getTime();
    const jours = Math.floor(dureeMs / (1000 * 60 * 60 * 24));
    const heures = Math.floor((dureeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (jours === 0 && heures === 0) return 'Moins d\'1 heure';
    if (jours === 0) return `${heures}h`;
    if (heures === 0) return `${jours} jour${jours > 1 ? 's' : ''}`;
    return `${jours}j ${heures}h`;
};

export default ArchivesView;
