// Script de migration pour mettre à jour les statuts des projets depuis le CSV
const csvData = `Projet,Achat,Soudage,Machinage,Peinture,Assemblage,Électrique,Test
Accessoire CSTE2010E #10,En attente,En attente,En attente,En attente,En attente,En attente,En attente
Accessoire CSTE2010E #9,En attente,En attente,En attente,En attente,En attente,En attente,En attente
Accessoire Uniboard #1,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En cours
Accessoire Uniboard #2,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé
Accessoire Uniboard #3,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En cours
Accessoire Uniboard #4,Terminé,Terminé,Terminé,Terminé,Terminé,En attente,En cours
Accessoire Uniboard #5,Terminé,Terminé,Terminé,Terminé,Terminé,En attente,En attente
Accessoire Uniboard #6,Terminé,Terminé,Terminé,Terminé,Terminé,En attente,En attente
AMR PL 20250614-4 #14,En cours,En attente,En attente,En attente,En attente,En attente,En attente
AMR PL 20250614-4 #15,En cours,En attente,En attente,En attente,En attente,En attente,En attente
AMR PL 20250614-4 #16,En cours,En attente,En attente,En attente,En attente,En attente,En attente
AMR PL 20250614-4 #17,En cours,En attente,En attente,En attente,En attente,En attente,En attente
AMR R&D #1,Terminé,Terminé,Terminé,Terminé,Terminé,Bloqué,Terminé
AMR Standard #11,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé
AMR Standard #12,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En cours
AMR Standard #13,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En cours
AMR Uniboard #1,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En attente
AMR Uniboard #2,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé
AMR Uniboard #3,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En attente
AMR Uniboard #4,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En attente
AMR Uniboard #5,Terminé,Terminé,Terminé,Terminé,Terminé,Terminé,En cours
AMR Uniboard #6,Terminé,Terminé,Terminé,Terminé,Terminé,En attente,En attente
AMR Uniboard #8,Terminé,Terminé,Terminé,Terminé,En attente,En attente,En attente`;

// Mappage des colonnes CSV vers les étapes de l'application
const etapeMapping = {
    'Achat': 'achat',
    'Soudage': 'soudage',
    'Machinage': 'coupe_materiel', // Machinage = Coupe matériel
    'Peinture': 'peinture_externe',
    'Assemblage': 'assemblage',
    'Électrique': 'assemblage_electrique_final',
    'Test': 'test_qualite'
};

// Mappage des statuts CSV vers les statuts de l'application
const statutMapping = {
    'En attente': 'en_attente',
    'En cours': 'en_cours',
    'Terminé': 'termine',
    'Bloqué': 'bloque'
};

function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    const headers = lines[0].split(',');
    const projets = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const projet = { nom: values[0], etapes: {} };

        for (let j = 1; j < headers.length; j++) {
            const etapeCSV = headers[j];
            const statutCSV = values[j];
            const etapeApp = etapeMapping[etapeCSV];
            const statutApp = statutMapping[statutCSV];

            if (etapeApp && statutApp) {
                projet.etapes[etapeApp] = statutApp;
            }
        }

        projets.push(projet);
    }

    return projets;
}

function mettreAJourProjets() {
    const projetsCSV = parseCSV(csvData);
    console.log('📊 Projets à mettre à jour:', projetsCSV.length);

    // Récupérer les projets actuels depuis localStorage
    const projetsExistants = JSON.parse(localStorage.getItem('noovelia-projets') || '[]');

    let projetsModifies = 0;
    let nouveauxProjets = 0;

    projetsCSV.forEach(projetCSV => {
        // Chercher le projet existant
        const projetExistant = projetsExistants.find(p => p.nom === projetCSV.nom);

        if (projetExistant) {
            // Mettre à jour les statuts des étapes existantes
            let etapesModifiees = 0;

            projetExistant.etapes.forEach(etape => {
                const nouveauStatut = projetCSV.etapes[etape.etape];
                if (nouveauStatut && etape.statut !== nouveauStatut) {
                    console.log(`🔄 ${projetCSV.nom} - ${etape.etape}: ${etape.statut} → ${nouveauStatut}`);
                    etape.statut = nouveauStatut;
                    etapesModifiees++;
                }
            });

            if (etapesModifiees > 0) {
                projetsModifies++;
            }
        } else {
            console.log(`➕ Nouveau projet détecté: ${projetCSV.nom}`);
            nouveauxProjets++;
            // Note: Pour le moment, on ne crée pas automatiquement les nouveaux projets
            // car ils nécessitent plus d'informations (dates, templates, etc.)
        }
    });

    // Sauvegarder les modifications
    localStorage.setItem('noovelia-projets', JSON.stringify(projetsExistants));

    console.log(`✅ Mise à jour terminée:`);
    console.log(`   📝 ${projetsModifies} projets modifiés`);
    console.log(`   🆕 ${nouveauxProjets} nouveaux projets détectés`);

    // Recharger la page pour voir les changements
    window.location.reload();
}

// Exporter la fonction pour utilisation
window.mettreAJourProjets = mettreAJourProjets;

console.log('🚀 Script de migration chargé. Tapez: mettreAJourProjets()');
