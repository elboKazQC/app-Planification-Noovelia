import { useMemo } from 'react';
import { Employe, Projet } from '../types';

interface Props {
    projets: Projet[];
    employes: Employe[];
}

// Simple heatbar by week for next 12 weeks: shows % utilization aggregated across competencies
export default function WorkloadForecast({ projets, employes }: Props) {
    const data = useMemo(() => {
        // capacity per week
        const capacity = employes.reduce((sum, e) => sum + e.heuresParSemaine, 0);

        // naive distribution: split non-terminées heures equally across next 8 weeks
        const weeks = Array.from({ length: 12 }).map((_, i) => ({
            start: addDays(startOfWeek(new Date()), i * 7),
            load: 0,
        }));

        const heuresTotales = projets.reduce((tot, p) => {
            const h = p.etapes.filter(e => e.statut !== 'termine').reduce((s, e) => s + e.heuresEstimees, 0) * p.quantite;
            return tot + h;
        }, 0);

        if (heuresTotales > 0) {
            const perWeek = heuresTotales / weeks.length;
            weeks.forEach(w => { w.load = perWeek; });
        }

        return { weeks, capacity };
    }, [projets, employes]);

    return (
        <div className="card">
            <h3>📈 Charge de travail à 12 semaines</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
                {data.weeks.map((w, idx) => {
                    const pct = data.capacity > 0 ? Math.min(200, Math.round((w.load / data.capacity) * 100)) : 0;
                    const color = pct < 60 ? '#2ecc71' : pct <= 100 ? '#f1c40f' : '#e74c3c';
                    return (
                        <div key={idx} title={`Semaine ${formatDate(w.start)}\nCharge: ${Math.round(w.load)}h / Capacité: ${data.capacity}h (${pct}%)`}>
                            <div style={{ height: 80, background: '#ecf0f1', borderRadius: 6, overflow: 'hidden', border: '1px solid #bdc3c7' }}>
                                <div style={{ height: `${Math.min(100, pct)}%`, background: color, width: '100%', transition: 'height .2s', marginTop: `${Math.max(0, 100 - Math.min(100, pct))}%` }} />
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 11, color: '#7f8c8d', marginTop: 6 }}>S{weekNumber(w.start)}</div>
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#7f8c8d' }}>
                Vert: sous-charge, Jaune: ~capacité, Rouge: surcharge. Calcul simplifié pour visualisation rapide.
            </div>
        </div>
    );
}

function startOfWeek(d: Date) { const x = new Date(d); const day = x.getDay(); const diff = (day + 6) % 7; x.setDate(x.getDate() - diff); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function weekNumber(d: Date) { const onejan = new Date(d.getFullYear(), 0, 1); const millis = (d.getTime() - onejan.getTime()); const day = Math.floor(millis / 86400000); return Math.ceil((day + onejan.getDay() + 1) / 7); }
function formatDate(d: Date) { return d.toLocaleDateString('fr-CA'); }
