import { useState } from 'react';
import { Employe, Competence } from '../types';

interface Props {
    employes: Employe[];
    setEmployes: (employes: Employe[]) => void;
}

const COMPETENCES_OPTIONS: { value: Competence; label: string }[] = [
    { value: 'soudage', label: '🔥 Soudage' },
    { value: 'assemblage', label: '🔧 Assemblage' },
    { value: 'electrique', label: '⚡ Électrique' },
    { value: 'machinage', label: '🏭 Machinage' },
    { value: 'coupe_materiel', label: '✂️ Coupe matériel' },
    { value: 'test_qualite', label: '🧪 Test qualité' },
    { value: 'test_logiciel', label: '💻 Test logiciel' },
    { value: 'achat', label: '💰 Achat' }
];

const HEURES_OPTIONS = [25, 30, 35, 40];

export default function GestionEmployes({ employes, setEmployes }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nom: '',
        competences: [] as Competence[],
        heuresParSemaine: 40,
        tauxHoraire: 0
    });

    const resetForm = () => {
        setFormData({
            nom: '',
            competences: [],
            heuresParSemaine: 40,
            tauxHoraire: 0
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nouveauEmploye: Employe = {
            id: editingId || Date.now().toString(),
            ...formData
        };

        if (editingId) {
            setEmployes(employes.map(emp => emp.id === editingId ? nouveauEmploye : emp));
        } else {
            setEmployes([...employes, nouveauEmploye]);
        }

        resetForm();
    };

    const handleEdit = (employe: Employe) => {
        setFormData({
            nom: employe.nom,
            competences: employe.competences,
            heuresParSemaine: employe.heuresParSemaine,
            tauxHoraire: employe.tauxHoraire || 0
        });
        setEditingId(employe.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            setEmployes(employes.filter(emp => emp.id !== id));
        }
    };

    const handleCompetenceChange = (competence: Competence) => {
        const newCompetences = formData.competences.includes(competence)
            ? formData.competences.filter(c => c !== competence)
            : [...formData.competences, competence];

        setFormData({ ...formData, competences: newCompetences });
    };

    return (
        <div className="gestion-employes">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>👥 Gestion des Employés</h2>
                    <button
                        className="button button-primary"
                        onClick={() => setShowForm(true)}
                    >
                        ➕ Ajouter un employé
                    </button>
                </div>

                {/* Liste des employés */}
                <div className="employes-list">
                    {employes.map(employe => (
                        <div key={employe.id} className="employe-card" style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '10px',
                            backgroundColor: '#f9f9f9'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{employe.nom}</h3>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>⏰ Heures/semaine:</strong> {employe.heuresParSemaine}h
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <strong>🛠️ Compétences:</strong>
                                        <div style={{ marginTop: '5px' }}>
                                            {employe.competences.map(comp => (
                                                <span key={comp} style={{
                                                    display: 'inline-block',
                                                    background: '#3498db',
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    margin: '2px 4px 2px 0'
                                                }}>
                                                    {COMPETENCES_OPTIONS.find(opt => opt.value === comp)?.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {employe.tauxHoraire && (
                                        <div>
                                            <strong>💰 Taux:</strong> {employe.tauxHoraire}$/h
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <button
                                        className="button button-primary"
                                        onClick={() => handleEdit(employe)}
                                        style={{ marginRight: '8px' }}
                                    >
                                        ✏️ Modifier
                                    </button>
                                    <button
                                        className="button button-danger"
                                        onClick={() => handleDelete(employe.id)}
                                    >
                                        🗑️ Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {employes.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#7f8c8d', margin: '40px 0' }}>
                        Aucun employé enregistré. Cliquez sur "Ajouter un employé" pour commencer.
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
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3>{editingId ? '✏️ Modifier employé' : '➕ Ajouter un employé'}</h3>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nom complet</label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Heures par semaine</label>
                                <select
                                    value={formData.heuresParSemaine}
                                    onChange={(e) => setFormData({ ...formData, heuresParSemaine: Number(e.target.value) })}
                                >
                                    {HEURES_OPTIONS.map(h => (
                                        <option key={h} value={h}>{h}h</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Taux horaire (optionnel)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.tauxHoraire}
                                    onChange={(e) => setFormData({ ...formData, tauxHoraire: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Compétences</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                                    {COMPETENCES_OPTIONS.map(comp => (
                                        <label key={comp.value} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            backgroundColor: formData.competences.includes(comp.value) ? '#e3f2fd' : 'white'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.competences.includes(comp.value)}
                                                onChange={() => handleCompetenceChange(comp.value)}
                                                style={{ marginRight: '8px' }}
                                            />
                                            {comp.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button type="submit" className="button button-primary">
                                    {editingId ? 'Mettre à jour' : 'Ajouter'}
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
