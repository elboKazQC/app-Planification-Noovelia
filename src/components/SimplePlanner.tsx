import { useEffect, useMemo, useState } from 'react';
import { Employe, Projet, EstimationEtape, Competence } from '../types';
import './SimplePlanner.css';

type Job = {
    id: string;
    nom: string;
    heures: number; // total heures restantes
    competence: Competence | 'mixte';
    debut?: string; // ISO date
    fin?: string; // ISO date
};

type Capacity = {
    totalHeuresParSemaine: number;
};

// Convert current rich Projet[] into simplified jobs list for quick planning
function projectsToJobs(projets: Projet[]): Job[] {
    const jobs: Job[] = [];
    projets.forEach(p => {
        const restant = p.etapes.filter(e => e.statut !== 'termine');
        const heures = restant.reduce((s, e) => s + e.heuresEstimees, 0) * (p.quantite || 1);
        if (heures > 0) {
            // Detect if single competence dominates, else mark as mixte
            const byComp: Record<string, number> = {};
            restant.forEach(e => {
                const key = e.competenceRequise.join('+');
                byComp[key] = (byComp[key] || 0) + e.heuresEstimees;
            });
            const top = Object.entries(byComp).sort((a, b) => b[1] - a[1])[0];
            const competence: Competence | 'mixte' = top && top[0].includes('+') ? 'mixte' : (top ? (top[0] as Competence) : 'mixte');
            jobs.push({ id: p.id, nom: p.nom, heures, competence, debut: p.dateCommande?.toString(), fin: p.dateVoulue?.toString() });
        }
    });
    return jobs;
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

export default function SimplePlanner({
    employes,
    projets,
    setProjets,
}: { employes: Employe[]; projets: Projet[]; setProjets: (p: Projet[]) => void }) {
    // Capacity settings (one slider), persisted
    const [capacity, setCapacity] = useState<Capacity>(() => {
        const saved = localStorage.getItem('sp-capacity');
        if (saved) return JSON.parse(saved);
        const total = employes.reduce((s, e) => s + (e.heuresParSemaine || 0), 0);
        return { totalHeuresParSemaine: total || 160 };
    });

    useEffect(() => { localStorage.setItem('sp-capacity', JSON.stringify(capacity)); }, [capacity]);

    // Jobs (editable list), starting from projects but fully user-editable
    const [jobs, setJobs] = useState<Job[]>(() => {
        const saved = localStorage.getItem('sp-jobs');
        if (saved) return JSON.parse(saved);
        return projectsToJobs(projets);
    });
    useEffect(() => { localStorage.setItem('sp-jobs', JSON.stringify(jobs)); }, [jobs]);

    // Sync: if nothing custom saved and projets change drastically, we could refresh, but keep it simple.

    // Add job form
    const [newJobName, setNewJobName] = useState('Nouveau job');
    const [newJobHours, setNewJobHours] = useState(40);
    const [newJobComp, setNewJobComp] = useState<Competence | 'mixte'>('mixte');

    const addJob = () => {
        const heures = clamp(Number(newJobHours) || 0, 0, 10000);
        if (!newJobName.trim() || heures <= 0) return;
        setJobs(j => [...j, { id: crypto.randomUUID(), nom: newJobName.trim(), heures, competence: newJobComp }]);
    };

    const updateJob = (id: string, patch: Partial<Job>) => {
        setJobs(j => j.map(x => x.id === id ? { ...x, ...patch } : x));
    };
    const removeJob = (id: string) => setJobs(j => j.filter(x => x.id !== id));
    const clearAll = () => setJobs([]);

    // Simple forecast: distribute hours sequentially across future weeks
    const forecast = useMemo(() => {
        const weeks = Array.from({ length: 12 }).map((_, i) => ({
            index: i,
            start: startOfWeek(addDays(new Date(), i * 7)),
            capacity: capacity.totalHeuresParSemaine,
            load: 0,
            items: [] as { jobId: string; heures: number }[],
        }));

        // Sequential fill: put each job into weeks until its hours are consumed
        jobs.forEach(job => {
            let remaining = job.heures;
            let w = 0;
            while (remaining > 0 && w < weeks.length) {
                const slot = Math.max(0, weeks[w].capacity - weeks[w].load);
                const take = Math.min(slot, remaining);
                if (take > 0) {
                    weeks[w].load += take;
                    weeks[w].items.push({ jobId: job.id, heures: take });
                    remaining -= take;
                }
                // if no capacity left, move to next week
                if (weeks[w].load >= weeks[w].capacity - 1e-6) w++;
                else if (take === 0) w++;
            }
            // If still remaining after 12 weeks, we just ignore overflow for visualization
        });

        return weeks;
    }, [jobs, capacity]);

    // Helper: create a real project from a simple job for persistence if desired
    const pushJobsToProjects = () => {
        const now = new Date();
        const toEtape = (job: Job): EstimationEtape => ({
            id: crypto.randomUUID(),
            etape: 'assemblage',
            competenceRequise: job.competence === 'mixte' ? ['assemblage'] : [job.competence as Competence],
            heuresEstimees: job.heures,
            statut: 'en_attente',
            historiqueStatuts: [],
            dateCreation: now,
        });

        const newProjects: Projet[] = jobs.map(j => ({
            id: crypto.randomUUID(),
            nom: j.nom,
            description: 'Créé depuis SimplePlanner',
            dateCommande: now,
            dateVoulue: addDays(now, 84),
            quantite: 1,
            etapes: [toEtape(j)],
            statut: 'en_attente',
            priorite: 'normale',
        }));
        setProjets(newProjects);
    };

    // UI
    return (
        <div className="sp-container">
            <div className="sp-header">
                <div className="sp-title">Planificateur simple</div>
                <div className="sp-flex">
                    <button className="sp-btn secondary" onClick={pushJobsToProjects}>Remplacer Projets avec cette liste</button>
                    <button className="sp-btn danger" onClick={clearAll}>Vider les jobs</button>
                </div>
            </div>

            <div className="sp-grid">
                <div className="sp-card">
                    <h3>Réglages</h3>
                    <div className="sp-row">
                        <span className="sp-hint">Capacité totale/semaine (heures)</span>
                        <input className="sp-input" type="number" min={1} max={10000}
                            value={capacity.totalHeuresParSemaine}
                            onChange={e => setCapacity({ totalHeuresParSemaine: clamp(Number(e.target.value) || 0, 1, 10000) })} />
                        <span className="sp-chip">Employés: {employes.length}</span>
                    </div>

                    <h3 style={{ marginTop: 16 }}>Ajouter un job</h3>
                    <div className="sp-row">
                        <input className="sp-input" value={newJobName} onChange={e => setNewJobName(e.target.value)} />
                        <input className="sp-input" type="number" value={newJobHours}
                            onChange={e => setNewJobHours(Number(e.target.value) || 0)} />
                        <select className="sp-input" value={newJobComp} onChange={e => setNewJobComp(e.target.value as any)}>
                            <option value="mixte">Mixte</option>
                            <option value="assemblage">Assemblage</option>
                            <option value="soudage">Soudage</option>
                            <option value="electrique">Électrique</option>
                            <option value="machinage">Machinage</option>
                            <option value="coupe_materiel">Coupe matériel</option>
                            <option value="test_qualite">Test qualité</option>
                            <option value="test_logiciel">Test logiciel</option>
                            <option value="achat">Achat</option>
                        </select>
                        <button className="sp-btn" onClick={addJob}>Ajouter</button>
                    </div>
                </div>

                <div className="sp-card">
                    <h3>Prévision (12 semaines)</h3>
                    <div className="sp-forecast">
                        {forecast.map((w, idx) => {
                            const pct = w.capacity > 0 ? Math.round((w.load / w.capacity) * 100) : 0;
                            const capped = clamp(pct, 0, 200);
                            const color = capped < 60 ? '#16a34a' : capped <= 100 ? '#f59e0b' : '#ef4444';
                            return (
                                <div key={idx}>
                                    <div className="sp-bar" title={`Semaine ${formatDate(w.start)}\nCharge: ${Math.round(w.load)}h / Capacité: ${w.capacity}h (${pct}%)`}>
                                        <div className="sp-bar-fill" style={{ height: `${Math.min(100, capped)}%`, background: color }} />
                                    </div>
                                    <div className="sp-bar-label">S{weekNumber(w.start)}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="sp-legend">Vert = facile, Jaune = plein, Rouge = trop.</div>
                </div>
            </div>

            <div className="sp-card" style={{ marginTop: 16 }}>
                <h3>Jobs (modifier en direct)</h3>
                <table className="sp-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Heures</th>
                            <th>Compétence</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(j => (
                            <tr key={j.id}>
                                <td>
                                    <input className="sp-input" value={j.nom} onChange={e => updateJob(j.id, { nom: e.target.value })} />
                                </td>
                                <td>
                                    <input className="sp-input" type="number" value={j.heures}
                                        onChange={e => updateJob(j.id, { heures: clamp(Number(e.target.value) || 0, 0, 10000) })} />
                                </td>
                                <td>
                                    <select className="sp-input" value={j.competence}
                                        onChange={e => updateJob(j.id, { competence: e.target.value as any })}>
                                        <option value="mixte">Mixte</option>
                                        <option value="assemblage">Assemblage</option>
                                        <option value="soudage">Soudage</option>
                                        <option value="electrique">Électrique</option>
                                        <option value="machinage">Machinage</option>
                                        <option value="coupe_materiel">Coupe matériel</option>
                                        <option value="test_qualite">Test qualité</option>
                                        <option value="test_logiciel">Test logiciel</option>
                                        <option value="achat">Achat</option>
                                    </select>
                                </td>
                                <td>
                                    <button className="sp-btn danger" onClick={() => removeJob(j.id)}>Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function startOfWeek(d: Date) { const x = new Date(d); const day = x.getDay(); const diff = (day + 6) % 7; x.setDate(x.getDate() - diff); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function weekNumber(d: Date) { const onejan = new Date(d.getFullYear(), 0, 1); const millis = (d.getTime() - onejan.getTime()); const day = Math.floor(millis / 86400000); return Math.ceil((day + onejan.getDay() + 1) / 7); }
function formatDate(d: Date) { return d.toLocaleDateString('fr-CA'); }
