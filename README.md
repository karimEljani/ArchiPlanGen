# PlanGen – Générateur de plans d'architecte (HTML / CSS / JS / PHP / MySQL)

## Installation
1. Copiez le dossier `plangen` dans le répertoire web (XAMPP `htdocs`, WAMP `www`, ou `/var/www/html`).
2. Importez `db.sql` dans MySQL (phpMyAdmin ou `mysql -u root -p < db.sql`).
   La table est aussi créée automatiquement au premier enregistrement.
3. Modifiez `config.php` (hôte, base, utilisateur, mot de passe).
4. Ouvrez `http://localhost/plangen/`.

Sans PHP/MySQL, l'application fonctionne quand même : les projets sont alors sauvegardés dans le navigateur (localStorage).

## Nouveautés v2
- **Plan de maçonnerie** : double bordure, cotes en cm, poteaux rouges, portes rouges, escalier, mobilier, surface « S = … m² » dans le cartouche.
- **Mode manuel** : chaque pièce est placée par coordonnées (x, y) et dimensions, avec portes (N/S/E/W) et fenêtres par côté ; permet de reproduire un plan de villa quelconque (bouton « Charger un exemple »).
- **Vue 3D** isométrique avec terrain, allée, clôture et arbres.

## Utilisation
- Saisissez les dimensions du terrain et du bâtiment (largeur, profondeur, niveaux, hauteur sous plafond, épaisseur des murs, couloir, toiture).
- Ajoutez les pièces avec leurs dimensions souhaitées (L × l) et leur côté (Avant = rue, Arrière = jardin).
  Les pièces sont automatiquement ajustées pour remplir exactement le bâtiment.
- Le plan se met à jour en direct.

## Feuilles générées (A3, cartouche inclus)
Plan de chaque niveau · Façade principale · Coupe A-A · Plan de masse · Tableau des surfaces et métré avec estimation du coût.

## Contenu d'un plan
Murs extérieurs et cloisons · portes (avec ouverture) · fenêtres · porte d'entrée et porte de garage · escalier · mobilier · noms et surfaces des pièces · cotations (chaînes et totales) · repère de coupe · flèche Nord · échelle graphique · cartouche.

## Exports
SVG, PNG et impression / PDF (toutes les feuilles, A3 paysage).

## Fichiers
index.php · api.php · config.php · db.sql · assets/app.js · assets/style.css
