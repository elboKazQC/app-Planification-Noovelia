# 🤖 Application de Planification Production AMR - Noovelia

Une application web moderne pour gérer la planification de production de robots mobiles autonomes (AMR), optimiser la charge de travail des employés et prévoir les besoins futurs en ressources humaines et matérielles.

## 🎯 Fonctionnalités principales

### 👥 Gestion des Employés
- **Enregistrement des compétences** : Soudage, assemblage, électromécanique, machinage, électrique, traitement de surface, achat, test
- **Gestion des horaires** : Support pour 25h, 35h et 40h/semaine
- **Polyvalence** : Un électromécanicien peut faire de l'électrique, mais un soudeur ne peut pas faire de l'électrique
- **Taux horaire** (optionnel)

### 📋 Gestion des Projets AMR
- **Étapes de production** : Achat → Soudage → Machinage → Traitement de surface → Assemblage → Électrique → Test
- **Estimation personnalisée** : Vous pourrez ajuster les heures pour chaque étape selon vos données réelles
- **Gestion des priorités** : Basse, normale, haute, urgente
- **Quantités multiples** : Support pour les commandes de plusieurs unités

### 📊 Dashboard Intelligent
- **Analyse de charge** : Visualisation de la répartition du travail par compétence
- **Détection de surcharge** : Alertes automatiques quand la capacité est dépassée
- **Prévisions** : Calcul des semaines-homme nécessaires
- **Alertes en temps réel** : Manque de personnel, projets urgents, retards

## 🛠️ Architecture Technique

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : CSS modules avec design responsive
- **État** : Gestion locale avec React hooks
- **Types** : TypeScript strict pour une meilleure maintenabilité

## 🚀 Installation et Démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Build de production
npm run build
```

L'application sera accessible à l'adresse : http://localhost:3000

## 👥 Configuration Initiale de Votre Équipe

L'application est pré-configurée avec votre équipe actuelle :

- **2 Soudeurs/Assembleurs** (40h/semaine)
  - Compétences : Soudage, Assemblage

- **2 Électromécaniciens** (35h/semaine)
  - Compétences : Électromécanique, Électrique, Assemblage, Soudage

- **1 Machiniste** (25h/semaine)
  - Compétences : Machinage

- **2 Acheteurs** (40h et 30h/semaine)
  - Compétences : Achat

**Total équipe : 7 personnes, 280h/semaine de capacité**

Vous pouvez modifier ces informations dans l'onglet "👥 Employés".

## 📈 Étapes Suivantes

1. **Calibrage des estimations** : Vous pourrez ajuster les heures pour chaque étape selon vos données historiques
2. **Ajout de détails** : Possibilité d'ajouter des sous-étapes plus précises si nécessaire
3. **Historique** : Suivi des projets terminés pour améliorer les estimations futures
4. **Intégration matériaux** : Liaison avec la gestion des stocks et des commandes

## 🎮 Utilisation

Dans la version simplifiée actuellement active, l'écran principal est un planificateur très simple (SimplePlanner) pensé pour être manipulé facilement.

1. Réglez la capacité totale/semaine (heures) en haut à gauche.
2. Ajoutez des jobs avec un nom, des heures et (optionnel) une compétence principale.
3. Modifiez les jobs directement dans la table (nom, heures, compétence) ou supprimez-les.
4. La prévision à 12 semaines montre en couleurs quand vous êtes sous-capacité (vert), à capacité (jaune) ou en surcharge (rouge).
5. Le bouton "Remplacer Projets avec cette liste" écrase vos projets détaillés avec des projets simples basés sur la liste courante.

## 🤝 Évolutions Futures

Cette version de base vous permettra de :
- ✅ Voir immédiatement les surcharges de travail
- ✅ Planifier les embauches nécessaires
- ✅ Identifier les goulots d'étranglement
- ✅ Prioriser les projets efficacement

Les prochaines versions pourront inclure :
- 📅 Calendrier détaillé avec dates précises
- 📦 Gestion des stocks et matériaux
- 📊 Rapports et métriques avancées
- 🔄 Historique et apprentissage automatique

---

**Développé pour optimiser votre production d'AMR** 🤖

Pour toute question ou amélioration, n'hésitez pas à faire des ajustements dans le code !


