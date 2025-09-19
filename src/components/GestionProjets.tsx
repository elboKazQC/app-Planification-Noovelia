import { useState } from 'react';
import { Projet, Employe, EtapeProduction, EstimationEtape, Competence, StatutTache, TemplateProjet } from '../types';
import DetailProjet from './DetailProjet';

interface Props {
    projets: Projet[];
    setProjets: (projets: Projet[]) => void;
    employes: Employe[];
    templates: TemplateProjet[];
}

const ETAPES_PRODUCTION: { value: EtapeProduction; label: string; competences: Competence[] }[] = [
    { value: 'achat', label: '💰 Achat', competences: ['achat'] },
    { value: 'coupe_materiel', label: '✂️ Coupe matériel', competences: ['machinage'] },
    { value: 'pre_assemblage_electrique', label: '🔌 Pré-assemblage électrique', competences: ['electrique'] },
    { value: 'soudage', label: '🔥 Soudure', competences: ['soudage'] },
    { value: 'peinture_externe', label: '🎨 Peinture (externe)', competences: [] }, // Externe = pas de compétence interne
    { value: 'assemblage', label: '🔧 Assemblage', competences: ['assemblage', 'electrique'] },
    { value: 'assemblage_electrique_final', label: '⚡ Assemblage électrique final', competences: ['electrique'] },
    { value: 'test_qualite', label: '🧪 Test qualité', competences: ['test_qualite'] }, // 🔧 CORRIGÉ: Plus d'électrique
    { value: 'test_logiciel', label: '💻 Test logiciel (équipe externe)', competences: [] }
];

const PRIORITES = [
    { value: 'basse', label: '⬇️ Basse', color: '#95a5a6' },
    { value: 'normale', label: '➡️ Normale', color: '#3498db' },
    { value: 'haute', label: '⬆️ Haute', color: '#f39c12' },
    { value: 'urgente', label: '🚨 Urgente', color: '#e74c3c' }
] as const;

export default function GestionProjets({ projets, setProjets, employes, templates }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [projetDetailId, setProjetDetailId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        dateCommande: new Date().toISOString().split('T')[0],
        dateVoulue: '',
        quantite: 1,
        priorite: 'normale' as 'basse' | 'normale' | 'haute' | 'urgente',
        etapes: ETAPES_PRODUCTION.map(etape => ({
            id: `${Date.now()}-${etape.value}`,
            etape: etape.value,
            competenceRequise: etape.competences,
            heuresEstimees: 0,
            dependances: [],
            materielRequis: [],
            statut: 'en_attente' as StatutTache,
            historiqueStatuts: [],
            dateCreation: new Date()
        })) as EstimationEtape[]
    });

    const resetForm = () => {
        setFormData({
            nom: '',
            description: '',
            dateCommande: new Date().toISOString().split('T')[0],
            dateVoulue: '',
            quantite: 1,
            priorite: 'normale' as 'basse' | 'normale' | 'haute' | 'urgente',
            etapes: ETAPES_PRODUCTION.map(etape => ({
                id: `${Date.now()}-${etape.value}`,
                etape: etape.value,
                competenceRequise: etape.competences,
                heuresEstimees: 0,
                dependances: [],
                materielRequis: [],
                statut: 'en_attente' as StatutTache,
                historiqueStatuts: [],
                dateCreation: new Date()
            })) as EstimationEtape[]
        });
        setEditingId(null);
        setShowForm(false);
    };

    const creerProjetDepuisTemplate = (template: TemplateProjet) => {
        const maintenant = new Date();
        const etapesAvecId = template.etapes.map(etapeTemplate => ({
            id: `${Date.now()}-${etapeTemplate.etape}`,
            etape: etapeTemplate.etape,
            competenceRequise: etapeTemplate.competenceRequise,
            heuresEstimees: etapeTemplate.heuresEstimees,
            dependances: [],
            materielRequis: [],
            statut: 'en_attente' as StatutTache,
            historiqueStatuts: [],
            dateCreation: maintenant
        }));

        setFormData({
            nom: `${template.nom} - ${new Date().toLocaleDateString('fr-FR')}`,
            description: `Projet créé à partir du template: ${template.description}`,
            dateCommande: new Date().toISOString().split('T')[0],
            dateVoulue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +3 mois par défaut
            quantite: 1,
            priorite: 'normale' as 'basse' | 'normale' | 'haute' | 'urgente',
            etapes: etapesAvecId
        });
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nouveauProjet: Projet = {
            id: editingId || Date.now().toString(),
            ...formData,
            dateCommande: new Date(formData.dateCommande),
            dateVoulue: new Date(formData.dateVoulue),
            statut: 'en_attente'
        };

        if (editingId) {
            setProjets(projets.map(proj => proj.id === editingId ? nouveauProjet : proj));
        } else {
            setProjets([...projets, nouveauProjet]);
        }

        resetForm();
    };

    const handleEdit = (projet: Projet) => {
        setFormData({
            nom: projet.nom,
            description: projet.description,
            dateCommande: projet.dateCommande.toISOString().split('T')[0],
            dateVoulue: projet.dateVoulue.toISOString().split('T')[0],
            quantite: projet.quantite,
            priorite: projet.priorite,
            etapes: projet.etapes
        });
        setEditingId(projet.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
            setProjets(projets.filter(proj => proj.id !== id));
        }
    };

    const updateEtapeHours = (etapeIndex: number, heures: number) => {
        const newEtapes = [...formData.etapes];
        newEtapes[etapeIndex].heuresEstimees = heures;
        setFormData({ ...formData, etapes: newEtapes });
    };

    const handleVoirDetail = (projetId: string) => {
        setProjetDetailId(projetId);
    };

    const handleUpdateProjet = (projetMisAJour: Projet) => {
        setProjets(projets.map(p => p.id === projetMisAJour.id ? projetMisAJour : p));
    };

    const handleRetourListe = () => {
        setProjetDetailId(null);
    };

    // Si on affiche le détail d'un projet
    if (projetDetailId) {
        const projetSelectionne = projets.find(p => p.id === projetDetailId);
        if (projetSelectionne) {
            return (
                <DetailProjet
                    projet={projetSelectionne}
                    onUpdateProjet={handleUpdateProjet}
                    onRetour={handleRetourListe}
                />
            );
        }
    }

    const calculateTotalHours = (etapes: EstimationEtape[]) => {
        return etapes.reduce((total, etape) => total + etape.heuresEstimees, 0);
    };

    const getCompetentEmployees = (competences: Competence[]) => {
        return employes.filter(emp =>
            competences.some(comp => emp.competences.includes(comp))
        ).length;
    };

    return (
        <div className="gestion-projets">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>📋 Gestion des Projets AMR</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    className="button button-success"
                                    onClick={() => creerProjetDepuisTemplate(template)}
                                    style={{ fontSize: '0.9em' }}
                                    title={`Créer rapidement: ${template.description}`}
                                >
                                    🚀 {template.nom}
                                </button>
                            ))}
                        </div>
                        <button
                            className="button button-primary"
                            onClick={() => setShowForm(true)}
                        >
                            ➕ Nouveau projet
                        </button>
                    </div>
                </div>

                {/* Liste des projets */}
                <div className="projets-list">
                    {projets.map(projet => {
                        const totalHeures = calculateTotalHours(projet.etapes);
                        const prioriteInfo = PRIORITES.find(p => p.value === projet.priorite);

                        return (
                            <div key={projet.id} className="projet-card" style={{
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '15px',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                            <h3 style={{ margin: 0, color: '#2c3e50', marginRight: '10px' }}>{projet.nom}</h3>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: 'white',
                                                backgroundColor: prioriteInfo?.color
                                            }}>
                                                {prioriteInfo?.label}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '8px' }}>
                                            <strong>📝 Description:</strong> {projet.description}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                            <div>
                                                <strong>📅 Commandé:</strong><br />
                                                {projet.dateCommande.toLocaleDateString('fr-CA')}
                                            </div>
                                            <div>
                                                <strong>🎯 Livraison:</strong><br />
                                                {projet.dateVoulue.toLocaleDateString('fr-CA')}
                                            </div>
                                            <div>
                                                <strong>🔢 Quantité:</strong><br />
                                                {projet.quantite} unité{projet.quantite > 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <strong>⏱️ Temps total estimé:</strong> {totalHeures}h ({Math.ceil(totalHeures / 40)} semaines-homme)
                                        </div>

                                        {/* Aperçu des étapes */}
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong>🔄 Étapes:</strong>
                                            <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '5px' }}>
                                                {projet.etapes.filter(e => e.heuresEstimees > 0).map(etape => {
                                                    const etapeInfo = ETAPES_PRODUCTION.find(e => e.value === etape.etape);
                                                    const employesDisponibles = getCompetentEmployees(etape.competenceRequise);

                                                    return (
                                                        <div key={etape.id} style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: employesDisponibles > 0 ? '#d4edda' : '#f8d7da',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            border: '1px solid ' + (employesDisponibles > 0 ? '#c3e6cb' : '#f5c6cb')
                                                        }}>
                                                            {etapeInfo?.label}: {etape.heuresEstimees}h
                                                            <br />
                                                            <span style={{ color: employesDisponibles > 0 ? '#155724' : '#721c24' }}>
                                                                {employesDisponibles} employé{employesDisponibles > 1 ? 's' : ''} capable{employesDisponibles > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            className="button"
                                            onClick={() => handleVoirDetail(projet.id)}
                                            style={{ marginRight: '8px', background: '#3498db' }}
                                        >
                                            📋 Détail
                                        </button>
                                        <button
                                            className="button button-primary"
                                            onClick={() => handleEdit(projet)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            ✏️ Modifier
                                        </button>
                                        <button
                                            className="button button-danger"
                                            onClick={() => handleDelete(projet.id)}
                                        >
                                            🗑️ Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {projets.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#7f8c8d', margin: '40px 0' }}>
                        Aucun projet enregistré. Cliquez sur "Nouveau projet" pour commencer.
                    </div>
                )}
            </div>

            {/* Formulaire d'ajout/modification */}
            {showForm && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '30px',
                        maxWidth: '800px',
                        width: '95%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3>{editingId ? '✏️ Modifier projet' : '➕ Nouveau projet AMR'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Nom du projet</label>
                                    <input
                                        type="text"
                                        value={formData.nom}
                                        onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Priorité</label>
                                    <select
                                        value={formData.priorite}
                                        onChange={(e) => setFormData({ ...formData, priorite: e.target.value as any })}
                                    >
                                        {PRIORITES.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Date de commande</label>
                                    <input
                                        type="date"
                                        value={formData.dateCommande}
                                        onChange={(e) => setFormData({ ...formData, dateCommande: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Date voulue</label>
                                    <input
                                        type="date"
                                        value={formData.dateVoulue}
                                        onChange={(e) => setFormData({ ...formData, dateVoulue: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Quantité</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantite}
                                        onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>🔄 Estimation des étapes (en heures par unité)</label>
                                <div style={{ marginTop: '10px' }}>
                                    {formData.etapes.map((etape, index) => {
                                        const etapeInfo = ETAPES_PRODUCTION.find(e => e.value === etape.etape);
                                        const employesDisponibles = getCompetentEmployees(etape.competenceRequise);

                                        return (
                                            <div key={etape.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px',
                                                padding: '8px',
                                                backgroundColor: employesDisponibles > 0 ? '#f8f9fa' : '#fff5f5',
                                                border: '1px solid ' + (employesDisponibles > 0 ? '#dee2e6' : '#fecaca'),
                                                borderRadius: '4px'
                                            }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <strong>{etapeInfo?.label}</strong>
                                                    <div style={{ fontSize: '12px', color: employesDisponibles > 0 ? '#28a745' : '#dc3545' }}>
                                                        {employesDisponibles} employé{employesDisponibles > 1 ? 's' : ''} capable{employesDisponibles > 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={etape.heuresEstimees}
                                                        onChange={(e) => updateEtapeHours(index, Number(e.target.value))}
                                                        style={{ width: '80px', marginRight: '5px' }}
                                                    />
                                                    <span>h</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div style={{
                                        marginTop: '15px',
                                        padding: '10px',
                                        backgroundColor: '#e8f4f8',
                                        borderRadius: '4px',
                                        border: '1px solid #bee5eb'
                                    }}>
                                        <strong>📊 Total par unité:</strong> {calculateTotalHours(formData.etapes)}h
                                        <br />
                                        <strong>📊 Total pour {formData.quantite} unité{formData.quantite > 1 ? 's' : ''}:</strong> {calculateTotalHours(formData.etapes) * formData.quantite}h
                                        <br />
                                        <strong>📊 Équivalent:</strong> {Math.ceil((calculateTotalHours(formData.etapes) * formData.quantite) / 40)} semaines-homme
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="button button-primary">
                                    {editingId ? 'Mettre à jour' : 'Créer le projet'}
                                </button>
                                <button type="button" className="button" onClick={resetForm}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
