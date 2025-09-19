import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjetKanban, PrioriteNiveau } from '../types';
import './ProjectCard.css';

interface Props {
    projet: ProjetKanban;
    isDragging?: boolean;
    onEdit?: (projet: ProjetKanban) => void;
    onViewHistory?: (projet: ProjetKanban) => void;
}

const ProjectCard: React.FC<Props> = ({ projet, isDragging = false, onEdit, onViewHistory }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({
        id: projet.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
    };

    // Icones et couleurs pour les types de véhicules
    const getVehiculeInfo = (type: string) => {
        switch (type) {
            case 'AMR PL': return { icone: '🚛', couleur: '#2196F3' };
            case 'AMR FL': return { icone: '🚚', couleur: '#FF9800' };
            case 'AMR Uniboard': return { icone: '📦', couleur: '#4CAF50' };
            case 'AMR R&D': return { icone: '🔬', couleur: '#9C27B0' };
            case 'Accessoire Uniboard': return { icone: '🔧', couleur: '#607D8B' };
            case 'Accessoire CSTE2010E': return { icone: '⚙️', couleur: '#795548' };
            default: return { icone: '📋', couleur: '#757575' };
        }
    };

    // Icones pour les priorités
    const getPrioriteInfo = (priorite: PrioriteNiveau) => {
        switch (priorite) {
            case 'basse': return { icone: '🟢', couleur: '#4CAF50' };
            case 'normale': return { icone: '🟡', couleur: '#FFC107' };
            case 'haute': return { icone: '🟠', couleur: '#FF9800' };
            case 'urgente': return { icone: '🔴', couleur: '#F44336' };
        }
    };

    const vehiculeInfo = getVehiculeInfo(projet.typeVehicule);
    const prioriteInfo = getPrioriteInfo(projet.priorite);

    // Calculer le temps dans la colonne actuelle
    const tempsColonneActuelle = () => {
        const dernierMouvement = projet.historiqueMovements
            .filter(m => m.colonneDestination === projet.colonneActuelle)
            .sort((a, b) => b.dateMovement.getTime() - a.dateMovement.getTime())[0];
        
        if (dernierMouvement) {
            const maintenant = new Date();
            const diffMs = maintenant.getTime() - dernierMouvement.dateMovement.getTime();
            const jours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const heures = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            if (jours > 0) {
                return `${jours}j ${heures}h`;
            } else {
                return `${heures}h`;
            }
        }
        return '0h';
    };

    // Formatage des dates
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-CA', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`project-card ${isDragging ? 'dragging' : ''}`}
            {...attributes}
            {...listeners}
        >
            {/* Header avec numéro et type */}
            <div className="card-header">
                <div className="numero-projet" style={{ borderColor: vehiculeInfo.couleur }}>
                    {vehiculeInfo.icone} {projet.numero}
                </div>
                <div className="priorite" style={{ color: prioriteInfo.couleur }}>
                    {prioriteInfo.icone}
                </div>
            </div>

            {/* Nom du projet */}
            <h3 className="projet-nom" title={projet.nom}>
                {projet.nom}
            </h3>

            {/* Informations principales */}
            <div className="card-info">
                <div className="info-item">
                    <span className="label">Type:</span>
                    <span className="value" style={{ color: vehiculeInfo.couleur }}>
                        {projet.typeVehicule}
                    </span>
                </div>
                <div className="info-item">
                    <span className="label">Client:</span>
                    <span className="value">{projet.client}</span>
                </div>
            </div>

            {/* Timeline */}
            <div className="card-timeline">
                <div className="timeline-item">
                    <span className="timeline-label">Créé:</span>
                    <span className="timeline-value">{formatDate(projet.dateCreation)}</span>
                </div>
                <div className="timeline-item">
                    <span className="timeline-label">Ici depuis:</span>
                    <span className="timeline-value">{tempsColonneActuelle()}</span>
                </div>
            </div>

            {/* Description si présente */}
            {projet.description && (
                <div className="card-description" title={projet.description}>
                    {projet.description}
                </div>
            )}

            {/* Actions */}
            <div className="card-actions">
                {onViewHistory && (
                    <button
                        className="action-btn history-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewHistory(projet);
                        }}
                        title="Voir l'historique"
                    >
                        📈
                    </button>
                )}
                {onEdit && (
                    <button
                        className="action-btn edit-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(projet);
                        }}
                        title="Modifier le projet"
                    >
                        ✏️
                    </button>
                )}
            </div>

            {/* Indicateur de progression (nombre d'étapes traversées) */}
            <div className="progress-indicator">
                <div className="progress-bar">
                    <div 
                        className="progress-fill" 
                        style={{ 
                            width: `${(projet.historiqueMovements.length - 1) * 12.5}%`,
                            backgroundColor: prioriteInfo.couleur 
                        }}
                    />
                </div>
                <span className="progress-text">
                    {projet.historiqueMovements.length - 1}/8 étapes
                </span>
            </div>
        </div>
    );
};

export default ProjectCard;