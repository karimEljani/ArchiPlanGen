<?php require __DIR__ . '/config.php'; ?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= htmlspecialchars(APP_NAME) ?></title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header>
  <h1><?= htmlspecialchars(APP_NAME) ?></h1>
  <div class="actions">
    <button id="bSave">Enregistrer</button>
    <button id="bSvg" class="ghost">Export SVG</button>
    <button id="bPng" class="ghost">Export PNG</button>
    <button id="bPrint" class="ghost">Imprimer / PDF (tout)</button>
  </div>
</header>
<main>
  <aside id="panel">
    <h2>Projet</h2>
    <label>Nom<input data-k="name"></label>
    <label>Client<input data-k="client"></label>
    <label>Dessiné par<input data-k="author"></label>
    <h2>Mode et affichage</h2>
    <div class="g3"><label>Mode<select data-k="mode"><option value="auto">Automatique</option><option value="manual">Manuel (x, y)</option></select></label>
    <label>Cotes en<select data-k="unit"><option value="cm">cm</option><option value="m">m</option></select></label>
    <label class="chk"><input type="checkbox" data-k="poteaux"> Poteaux</label></div>
    <button id="bEx" class="ghost" style="margin-top:6px">Charger un exemple (plan de villa)</button>
    <h2>Terrain (m)</h2>
    <div class="g3"><label>Largeur<input type="number" step="0.5" min="5" data-k="terrainW"></label>
    <label>Profondeur<input type="number" step="0.5" min="5" data-k="terrainD"></label>
    <label>Retrait<input type="number" step="0.5" min="0" data-k="setback"></label></div>
    <h2>Bâtiment (m) <small class="auto-only">— mode automatique</small></h2>
    <div class="g3"><label>Largeur<input type="number" step="0.1" min="4" data-k="W"></label>
    <label>Profondeur<input type="number" step="0.1" min="4" data-k="D"></label>
    <label>Niveaux<input type="number" step="1" min="1" max="4" data-k="floors"></label>
    <label>H. plafond<input type="number" step="0.05" min="2.2" data-k="h"></label>
    <label>Mur ext.<input type="number" step="0.01" min="0.1" data-k="tExt"></label>
    <label>Cloison<input type="number" step="0.01" min="0.05" data-k="tInt"></label>
    <label>Couloir<input type="number" step="0.1" min="0.8" data-k="corr"></label>
    <label>Toiture<select data-k="roof"><option value="terrasse">Terrasse</option><option value="tuiles">Tuiles (2 pentes)</option></select></label>
    <label>Prix/m²<input type="number" step="50" min="0" data-k="price"></label></div>
    <h2>Pièces</h2>
    <div id="rooms"></div>
    <button id="bAdd" class="ghost">+ Ajouter une pièce</button>
    <p class="hint auto-only">Automatique : Avant = rue, Arrière = jardin ; les pièces sont ajustées pour remplir le bâtiment.</p>
    <p class="hint man-only">Manuel : x, y = angle haut-gauche de la pièce (m, depuis l'angle extérieur du bâtiment). Portes : lettres N S E W du côté de la porte (ex. « SE »). Fenêtres : lettres, vide = automatique, « - » = aucune. Posez les pièces bord à bord.</p>
    <h2>Projets enregistrés</h2>
    <select id="saved"></select>
    <div class="row"><button id="bLoad" class="ghost">Ouvrir</button><button id="bDel" class="ghost">Supprimer</button><button id="bNew" class="ghost">Nouveau</button></div>
  </aside>
  <section id="view"><nav id="tabs"></nav><div id="sheet"></div></section>
</main>
<div id="printArea"></div>
<script src="assets/app.js"></script>
</body>
</html>
