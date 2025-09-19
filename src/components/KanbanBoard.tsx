import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCorners,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    ProjetKanban,
    KanbanColumn,
    KanbanState,
    ConfigurationColonne,
    TypeVehicule,
    PrioriteNiveau,
    MouvementHistoire
} from '../types';
import ProjectCard from './ProjectCard';
import KanbanColonne from './KanbanColonne';
import { initialiserKanbanAvecProjetsExistants } from '../utils/conversionKanban';
import './KanbanBoard.css';

// Configuration des colonnes
const COLONNES_CONFIG: ConfigurationColonne[] = [
    { id: 'nouveau_projet', titre: 'Nouveau Projet', couleur: '#e3f2fd', icone: '🆕', ordre: 1 },
    { id: 'achat', titre: 'Achat', couleur: '#f3e5f5', icone: '🛒', ordre: 2 },
    { id: 'soudage', titre: 'Soudage', couleur: '#fff3e0', icone: '🔥', ordre: 3 },
    { id: 'machinage', titre: 'Machinage', couleur: '#e8f5e8', icone: '⚙️', ordre: 4 },
    { id: 'peinture', titre: 'Peinture', couleur: '#fce4ec', icone: '🎨', ordre: 5 },
    { id: 'assemblage', titre: 'Assemblage', couleur: '#f1f8e9', icone: '🔧', ordre: 6 },
    { id: 'electrique', titre: 'Électrique', couleur: '#fff8e1', icone: '⚡', ordre: 7 },
    { id: 'test', titre: 'Test', couleur: '#e0f2f1', icone: '🧪', ordre: 8 },
    { id: 'termine', titre: 'Terminé', couleur: '#e8f5e8', icone: '✅', ordre: 9 },
];

interface Props {
    onShowArchives?: () => void;
}

const KanbanBoard: React.FC<Props> = ({ onShowArchives }) => {
    const [kanbanState, setKanbanState] = useState<KanbanState>(() => {
        // Vérifier si le Kanban a déjà été initialisé
        const kanbanInitialized = localStorage.getItem('noovelia-kanban-initialized');

        if (!kanbanInitialized) {
            // Première fois - essayer d'importer les projets existants
            const importedState = initialiserKanbanAvecProjetsExistants();
            if (importedState) {
                return importedState;
            }
        }

        // Charger l'état sauvegardé ou créer un état vide
        const saved = localStorage.getItem('noovelia-kanban-state');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Reconvertir les dates string en Date objects
            parsed.projets = parsed.projets.map((p: any) => ({
                ...p,
                dateCreation: new Date(p.dateCreation),
                dateModification: new Date(p.dateModification),
                dateArchivage: p.dateArchivage ? new Date(p.dateArchivage) : undefined,
                historiqueMovements: p.historiqueMovements.map((m: any) => ({
                    ...m,
                    dateMovement: new Date(m.dateMovement)
                }))
            }));
            parsed.projetsArchives = parsed.projetsArchives?.map((p: any) => ({
                ...p,
                dateCreation: new Date(p.dateCreation),
                dateModification: new Date(p.dateModification),
                dateArchivage: p.dateArchivage ? new Date(p.dateArchivage) : undefined,
                historiqueMovements: p.historiqueMovements.map((m: any) => ({
                    ...m,
                    dateMovement: new Date(m.dateMovement)
                }))
            })) || [];
            return parsed;
        }

        // État initial vide
        return {
            projets: [],
            projetsArchives: [],
            colonnes: COLONNES_CONFIG.reduce((acc, config) => {
                acc[config.id] = {
                    id: config.id,
                    titre: config.titre,
                    couleur: config.couleur,
                    projets: []
                };
                return acc;
            }, {} as KanbanState['colonnes'])
        };
    });

    const [activeProjet, setActiveProjet] = useState<ProjetKanban | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    // Configuration des sensors pour le drag & drop
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 8,
            },
        })
    );

    // Sauvegarder automatiquement l'état
    const sauvegarderEtat = useCallback((nouvelEtat: KanbanState) => {
        localStorage.setItem('noovelia-kanban-state', JSON.stringify(nouvelEtat));
    }, []);

    // Sauvegarder quand l'état change
    useEffect(() => {
        sauvegarderEtat(kanbanState);
    }, [kanbanState, sauvegarderEtat]);

    // Générer un numéro de projet unique
    const genererNumeroProjet = (typeVehicule: TypeVehicule): string => {
        const annee = new Date().getFullYear();
        const typeCode = typeVehicule.replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const existingNumbers = kanbanState.projets
            .filter(p => p.numero.includes(`${typeCode}-${annee}`))
            .map(p => {
                const match = p.numero.match(/-(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            });
        const nextNumber = Math.max(0, ...existingNumbers) + 1;
        return `${typeCode}-${annee}-${nextNumber.toString().padStart(3, '0')}`;
    };

    // Créer un nouveau projet
    const creerNouveauProjet = (data: {
        nom: string;
        typeVehicule: TypeVehicule;
        client: string;
        priorite: PrioriteNiveau;
        description?: string;
    }) => {
        const nouveauProjet: ProjetKanban = {
            id: Date.now().toString(),
            numero: genererNumeroProjet(data.typeVehicule),
            nom: data.nom,
            typeVehicule: data.typeVehicule,
            client: data.client,
            priorite: data.priorite,
            colonneActuelle: 'nouveau_projet',
            dateCreation: new Date(),
            dateModification: new Date(),
            description: data.description,
            historiqueMovements: [{
                id: Date.now().toString(),
                projetId: '',
                colonneSource: null,
                colonneDestination: 'nouveau_projet',
                dateMovement: new Date()
            }],
            estArchive: false
        };

        // Mettre à jour l'ID du mouvement
        nouveauProjet.historiqueMovements[0].projetId = nouveauProjet.id;

        setKanbanState(prev => ({
            ...prev,
            projets: [...prev.projets, nouveauProjet],
            colonnes: {
                ...prev.colonnes,
                nouveau_projet: {
                    ...prev.colonnes.nouveau_projet,
                    projets: [...prev.colonnes.nouveau_projet.projets, nouveauProjet.id]
                }
            }
        }));

        setShowNewProjectModal(false);
    };

    // Gérer le début du drag
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const projet = kanbanState.projets.find(p => p.id === active.id);
        setActiveProjet(projet || null);
    };

    // Gérer la fin du drag
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveProjet(null);

        if (!over) return;

        const projetId = active.id as string;
        const nouvelleColonne = over.id as KanbanColumn;

        const projet = kanbanState.projets.find(p => p.id === projetId);
        if (!projet || projet.colonneActuelle === nouvelleColonne) return;

        // Créer le mouvement dans l'historique
        const nouveauMouvement: MouvementHistoire = {
            id: Date.now().toString(),
            projetId: projetId,
            colonneSource: projet.colonneActuelle,
            colonneDestination: nouvelleColonne,
            dateMovement: new Date()
        };

        setKanbanState(prev => {
            const nouveauxProjets = prev.projets.map(p => {
                if (p.id === projetId) {
                    return {
                        ...p,
                        colonneActuelle: nouvelleColonne,
                        dateModification: new Date(),
                        historiqueMovements: [...p.historiqueMovements, nouveauMouvement],
                        // Si terminé, marquer comme archivé
                        estArchive: nouvelleColonne === 'termine',
                        dateArchivage: nouvelleColonne === 'termine' ? new Date() : p.dateArchivage
                    };
                }
                return p;
            });

            // Mettre à jour les colonnes
            const nouvellesColonnes = { ...prev.colonnes };

            // Retirer de l'ancienne colonne
            nouvellesColonnes[projet.colonneActuelle] = {
                ...nouvellesColonnes[projet.colonneActuelle],
                projets: nouvellesColonnes[projet.colonneActuelle].projets.filter(id => id !== projetId)
            };

            // Ajouter à la nouvelle colonne (sauf si terminé)
            if (nouvelleColonne !== 'termine') {
                nouvellesColonnes[nouvelleColonne] = {
                    ...nouvellesColonnes[nouvelleColonne],
                    projets: [...nouvellesColonnes[nouvelleColonne].projets, projetId]
                };
            }

            // Si terminé, déplacer vers les archives
            let nouveauxArchives = prev.projetsArchives;
            if (nouvelleColonne === 'termine') {
                const projetArchive = nouveauxProjets.find(p => p.id === projetId);
                if (projetArchive) {
                    nouveauxArchives = [...prev.projetsArchives, projetArchive];
                }
            }

            return {
                projets: nouvelleColonne === 'termine'
                    ? nouveauxProjets.filter(p => p.id !== projetId)
                    : nouveauxProjets,
                projetsArchives: nouveauxArchives,
                colonnes: nouvellesColonnes
            };
        });
    };

    const projetsActifs = kanbanState.projets.filter(p => !p.estArchive);
    const totalProjetsArchives = kanbanState.projetsArchives.length;

    // Fonction pour réimporter les projets
    const reimporterProjets = () => {
        const importedState = initialiserKanbanAvecProjetsExistants();
        if (importedState) {
            setKanbanState(importedState);
            alert(`✅ ${importedState.projets.length + importedState.projetsArchives.length} projets importés depuis l'ancien système !`);
        } else {
            alert('❌ Aucun projet à importer trouvé dans l\'ancien système.');
        }
    };

    return (
        <div className="kanban-board">
            <div className="kanban-header">
                <h1>🚗 Suivi de Production Véhicules</h1>
                <div className="kanban-actions">
                    <button
                        className="btn-nouveau-projet"
                        onClick={() => setShowNewProjectModal(true)}
                    >
                        + Nouveau Projet
                    </button>
                    {projetsActifs.length === 0 && (
                        <button
                            className="btn-import"
                            onClick={reimporterProjets}
                            title="Importer les 22 projets depuis l'ancien système"
                        >
                            📥 Importer Projets
                        </button>
                    )}
                    {totalProjetsArchives > 0 && (
                        <button
                            className="btn-archives"
                            onClick={onShowArchives}
                        >
                            📁 Archives ({totalProjetsArchives})
                        </button>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="kanban-colonnes">
                    {COLONNES_CONFIG.filter(config => config.id !== 'termine').map(config => (
                        <KanbanColonne
                            key={config.id}
                            config={config}
                            projets={projetsActifs.filter(p => p.colonneActuelle === config.id)}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeProjet ? (
                        <div className="drag-overlay">
                            <ProjectCard projet={activeProjet} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {showNewProjectModal && (
                <NewProjectModal
                    onClose={() => setShowNewProjectModal(false)}
                    onSubmit={creerNouveauProjet}
                />
            )}
        </div>
    );
};

// Composant Modal pour créer un nouveau projet
interface NewProjectModalProps {
    onClose: () => void;
    onSubmit: (data: {
        nom: string;
        typeVehicule: TypeVehicule;
        client: string;
        priorite: PrioriteNiveau;
        description?: string;
    }) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        nom: '',
        typeVehicule: 'AMR PL' as TypeVehicule,
        client: '',
        priorite: 'normale' as PrioriteNiveau,
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.nom.trim() && formData.client.trim()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🆕 Nouveau Projet</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Nom du projet *</label>
                        <input
                            type="text"
                            value={formData.nom}
                            onChange={e => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                            placeholder="Ex: AMR pour entrepôt client X"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Type de véhicule *</label>
                        <select
                            value={formData.typeVehicule}
                            onChange={e => setFormData(prev => ({ ...prev, typeVehicule: e.target.value as TypeVehicule }))}
                        >
                            <option value="AMR PL">AMR PL</option>
                            <option value="AMR FL">AMR FL</option>
                            <option value="AMR Uniboard">AMR Uniboard</option>
                            <option value="AMR R&D">AMR R&D</option>
                            <option value="Accessoire Uniboard">Accessoire Uniboard</option>
                            <option value="Accessoire CSTE2010E">Accessoire CSTE2010E</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Client *</label>
                        <input
                            type="text"
                            value={formData.client}
                            onChange={e => setFormData(prev => ({ ...prev, client: e.target.value }))}
                            placeholder="Nom du client"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Priorité</label>
                        <select
                            value={formData.priorite}
                            onChange={e => setFormData(prev => ({ ...prev, priorite: e.target.value as PrioriteNiveau }))}
                        >
                            <option value="basse">🟢 Basse</option>
                            <option value="normale">🟡 Normale</option>
                            <option value="haute">🟠 Haute</option>
                            <option value="urgente">🔴 Urgente</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Description optionnelle du projet..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Annuler
                        </button>
                        <button type="submit" className="btn-create">
                            Créer le Projet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KanbanBoard;
