# 🛒 Guide d'Utilisation - Planification des Achats Noovelia

## Vue d'ensemble

Votre application de planification Noovelia a été améliorée avec un système de gestion des achats intelligent qui vous aide à éviter les temps morts en anticipant les commandes de matériaux avec 2 mois d'avance.

## 🆕 Nouvelles Fonctionnalités

### 1. Section Planification des Achats (Dashboard)

La nouvelle section apparaît en haut de votre Dashboard avec :

- **📊 Statistiques en temps réel** : Nombre d'achats urgents, à prévoir, et futurs
- **🚨 Alertes d'achat** : Notifications automatiques basées sur vos délais de soudage
- **📅 Planning détaillé** : Vue tabulaire de tous vos achats planifiés
- **🗓️ Calendrier visuel** : Vue calendrier pour planifier visuellement vos commandes

### 2. Système d'Alertes Intelligent

#### Types d'alertes :
- **🚨 CRITIQUE (≤ 7 jours)** : Commandes en retard ou très urgentes
- **⏰ ATTENTION (≤ 30 jours)** : Commandes à prévoir bientôt
- **📝 INFO (> 30 jours)** : Planification future

#### Calcul automatique :
- Analyse de vos projets en cours
- Identification des étapes de soudage
- Calcul rétroactif : Date de soudage - Délai fournisseur - Marge de sécurité (7j)

### 3. Gestion des Matériaux

#### Matériaux intégrés par défaut :
- **Acier Inox 316L** (45 jours de délai)
- **Tôle Acier 5mm** (60 jours de délai)
- **Moteurs Brushless 24V** (75 jours de délai)
- **Cartes électroniques AMR** (90 jours de délai)
- **Câbles électriques** (30 jours de délai)
- **Peinture industrielle** (21 jours de délai)
- **Aluminium 6061-T6** (35 jours de délai)
- **Visserie inox** (14 jours de délai)

#### Informations par matériau :
- Quantité requise vs stock disponible
- Fournisseur habituel
- Prix unitaire (pour budgeting futur)
- Seuil d'alerte personnalisé
- Statut de commande

### 4. Vue Calendrier Interactive

#### Fonctionnalités :
- Navigation par mois (← →)
- Jour actuel surligné en bleu
- Événements d'achat colorés par urgence
- Tooltip détaillé au survol
- Résumé des 7 prochains jours

#### Codes couleurs :
- **Rouge** : Urgent (≤ 7 jours)
- **Orange** : Attention (≤ 30 jours)
- **Vert** : Normal (> 30 jours)

## 🎯 Comment l'utiliser pour éviter les temps morts

### 1. Consultez quotidiennement les alertes
- Ouvrez le **Dashboard**
- Vérifiez la section **"Planification des Achats"**
- Priorisez les alertes **CRITIQUES** (rouge)

### 2. Planifiez vos achats avec le calendrier
- Cliquez sur l'onglet **"🗓️ Vue Calendrier"**
- Naviguez entre les mois pour voir la charge future
- Utilisez les "Prochains achats (7 jours)" pour votre planning hebdomadaire

### 3. Suivez le tableau de planning
- Onglet **"📅 Planning"** pour vue détaillée
- Colonnes importantes :
  - **Date Commande** : Quand commander
  - **Jours Restants** : Urgence (négatif = en retard!)
  - **Stock** : Rouge si insuffisant

### 4. Workflow recommandé

#### Routine quotidienne (5 min) :
1. Vérifier les alertes critiques
2. Traiter les commandes en retard
3. Planifier les achats du jour

#### Routine hebdomadaire (15 min) :
1. Consulter le calendrier pour la semaine à venir
2. Préparer les bons de commande
3. Contacter les fournisseurs pour délais urgents

#### Routine mensuelle (30 min) :
1. Analyser les tendances sur le calendrier mensuel
2. Négocier avec fournisseurs pour réduire délais
3. Ajuster les stocks de sécurité si nécessaire

## 🔧 Personnalisation Avancée

### Modifier les délais fournisseurs :
```typescript
// Dans App.tsx, section materiauxStandard
delaiLivraisonJours: 45 // Changer selon votre négociation
```

### Ajuster les seuils d'alerte :
```typescript
seuilAlerte: 20 // Seuil en dessous duquel alerter
```

### Ajouter de nouveaux matériaux :
```typescript
{
    id: 'nouveau-materiau',
    nom: 'Mon Nouveau Matériau',
    quantite: 10,
    unite: 'pcs',
    fournisseur: 'Mon Fournisseur',
    delaiLivraisonJours: 30,
    // ... autres propriétés
}
```

## 💡 Conseils pour Optimiser

### 1. Négociez les délais
- Utilisez les statistiques pour négocier
- Identifiez vos matériaux critiques
- Etablissez des contrats cadres

### 2. Optimisez vos stocks
- Surveillez les matériaux souvent en rupture
- Ajustez les seuils selon votre historique
- Considérez des stocks tampons pour matériaux critiques

### 3. Anticipez les pics d'activité
- Le calendrier vous montre les périodes chargées
- Commandez en avance durant ces périodes
- Communiquez avec vos fournisseurs sur vos prévisions

## 🚀 Prochaines Améliorations Suggérées

- **Intégration ERP** : Connexion automatique aux stocks
- **Notifications email/SMS** : Alertes automatiques
- **Historique des commandes** : Tracking et analyse
- **Prédictions IA** : Anticipation basée sur historique
- **Interface mobile** : Consultation en déplacement

---

## 📞 Support

En cas de questions ou pour des personnalisations spécifiques, n'hésitez pas à demander de l'aide !

**Bonne planification ! 🎯**
