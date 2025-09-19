import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProjetKanban, ConfigurationColonne } from '../types';
import ProjectCard from './ProjectCard';
import './KanbanColonne.css';

interface Props {
    config: ConfigurationColonne;
    projets: ProjetKanban[];
    onEditProject?: (projet: ProjetKanban) => void;
    onViewHistory?: (projet: ProjetKanban) => void;
}

const KanbanColonne: React.FC<Props> = ({ 
    config, 
    projets, 
    onEditProject, 
    onViewHistory 
}) => {
    const {
        setNodeRef,
        isOver,
        active
    } = useDroppable({
        id: config.id,
    });

    // Trier les projets par priorité et date de création
    const projetsTries = [...projets].sort((a, b) => {
        const prioriteOrder = { 'urgente': 4, 'haute': 3, 'normale': 2, 'basse': 1 };
        const prioriteA = prioriteOrder[a.priorite];
        const prioriteB = prioriteOrder[b.priorite];
        
        if (prioriteA !== prioriteB) {
            return prioriteB - prioriteA; // Priorité descendante
        }
        
        return a.dateCreation.getTime() - b.dateCreation.getTime(); // Date ascendante
    });

    const isDraggedOver = isOver && active;

    return (
        <div className="kanban-colonne">
            {/* Header de la colonne */}
            <div 
                className="colonne-header"
                style={{ backgroundColor: config.couleur }}
            >
                <div className="colonne-title">
                    <span className="colonne-icone">{config.icone}</span>
                    <h2>{config.titre}</h2>
                </div>
                <div className="colonne-count">
                    {projets.length}
                </div>
            </div>

            {/* Zone de drop */}
            <div
                ref={setNodeRef}
                className={`colonne-content ${isDraggedOver ? 'drag-over' : ''}`}
            >
                <SortableContext 
                    items={projetsTries.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {projetsTries.length > 0 ? (
                        projetsTries.map(projet => (
                            <ProjectCard
                                key={projet.id}
                                projet={projet}
                                onEdit={onEditProject}
                                onViewHistory={onViewHistory}
                            />
                        ))
                    ) : (
                        <div className="colonne-empty">
                            <div className="empty-illustration">
                                {config.icone}
                            </div>
                            <p className="empty-text">
                                Aucun projet en {config.titre.toLowerCase()}
                            </p>
                            {isDraggedOver && (
                                <div className="drop-indicator">
                                    Déposer ici
                                </div>
                            )}
                        </div>
                    )}
                </SortableContext>

                {/* Indicateur de drop quand des projets sont présents */}
                {isDraggedOver && projetsTries.length > 0 && (
                    <div className="drop-zone-indicator">
                        Déposer le projet ici
                    </div>
                )}
            </div>

            {/* Footer avec statistiques */}
            {projets.length > 0 && (
                <div className="colonne-footer">
                    <div className="stats">
                        {/* Répartition par priorité */}
                        <div className="priority-stats">
                            {['urgente', 'haute', 'normale', 'basse'].map(priorite => {
                                const count = projets.filter(p => p.priorite === priorite).length;
                                if (count === 0) return null;
                                
                                const couleur = {
                                    'urgente': '#F44336',
                                    'haute': '#FF9800',
                                    'normale': '#FFC107',
                                    'basse': '#4CAF50'
                                }[priorite];
                                
                                const icone = {
                                    'urgente': '🔴',
                                    'haute': '🟠', 
                                    'normale': '🟡',
                                    'basse': '🟢'
                                }[priorite];

                                return (
                                    <span 
                                        key={priorite} 
                                        className="priority-stat"
                                        style={{ color: couleur }}
                                        title={`${count} projet(s) priorité ${priorite}`}
                                    >
                                        {icone} {count}
                                    </span>
                                );
                            })}
                        </div>

                        {/* Temps moyen dans cette colonne */}
                        <div className="time-stats">
                            <span className="time-label">⏱️</span>
                            <span className="time-value">
                                {calculeTempsMovenColonne(projets)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Fonction utilitaire pour calculer le temps moyen dans une colonne
const calculeTempsMovenColonne = (projets: ProjetKanban[]): string => {
    if (projets.length === 0) return '0h';

    const temps = projets.map(projet => {
        const dernierMouvement = projet.historiqueMovements
            .filter(m => m.colonneDestination === projet.colonneActuelle)
            .sort((a, b) => b.dateMovement.getTime() - a.dateMovement.getTime())[0];
        
        if (dernierMouvement) {
            const maintenant = new Date();
            return maintenant.getTime() - dernierMouvement.dateMovement.getTime();
        }
        return 0;
    });

    const tempsMovenMs = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    const heures = Math.floor(tempsMovenMs / (1000 * 60 * 60));
    const jours = Math.floor(heures / 24);

    if (jours > 0) {
        return `${jours}j`;
    } else {
        return `${heures}h`;
    }
};

export default KanbanColonne;