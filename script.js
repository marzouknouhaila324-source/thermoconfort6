
"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const temperatureInput = document.getElementById("temperature");
    const temperatureRange = document.getElementById("temperatureRange");
    const humidityInput = document.getElementById("humidite");
    const humidityRange = document.getElementById("humiditeRange");
    const evaluateButton = document.getElementById("evaluer");
    const errorMessage = document.getElementById("error-message");

    // Fonctions d'appartenance de la température
    function temperatureFroide(t) {
        if (t <= 10) return 1;
        if (t >= 20) return 0;
        return (20 - t) / 10;
    }

    function temperatureModeree(t) {
        if (t <= 15 || t >= 30) return 0;
        if (t <= 22.5) return (t - 15) / 7.5;
        return (30 - t) / 7.5;
    }

    function temperatureChaude(t) {
        if (t <= 25) return 0;
        if (t >= 35) return 1;
        return (t - 25) / 10;
    }

    // Fonctions d'appartenance de l'humidité
    function humiditeFaible(h) {
        if (h <= 20) return 1;
        if (h >= 40) return 0;
        return (40 - h) / 20;
    }

    function humiditeMoyenne(h) {
        if (h <= 30 || h >= 70) return 0;
        if (h <= 50) return (h - 30) / 20;
        return (70 - h) / 20;
    }

    function humiditeElevee(h) {
        if (h <= 60) return 0;
        if (h >= 80) return 1;
        return (h - 60) / 20;
    }

    // Limiter les résultats entre 0 et 1
    function limiter(valeur) {
        return Math.max(0, Math.min(1, valeur));
    }

    // Afficher le degré numérique et mettre à jour sa barre
    function afficherAppartenance(nom, valeur) {
        const valeurElement = document.getElementById(nom + "-value");
        const barreElement = document.getElementById(nom + "-bar");
        const degre = limiter(valeur);

        if (valeurElement) {
            valeurElement.textContent = degre.toFixed(2);
        }

        if (barreElement) {
            barreElement.style.width = (degre * 100) + "%";
            barreElement.setAttribute("aria-valuenow", degre.toFixed(2));
        }
    }

    // Synchroniser les champs numériques et les curseurs
    function synchroniser(source, cible) {
        source.addEventListener("input", function () {
            cible.value = source.value;
        });
    }

    synchroniser(temperatureRange, temperatureInput);
    synchroniser(temperatureInput, temperatureRange);
    synchroniser(humidityRange, humidityInput);
    synchroniser(humidityInput, humidityRange);

    // Vérifier les valeurs saisies
    function lireParametres() {
        const temperature = Number(temperatureInput.value);
        const humidite = Number(humidityInput.value);

        if (
            temperatureInput.value.trim() === "" ||
            !Number.isFinite(temperature) ||
            temperature < 0 ||
            temperature > 50
        ) {
            afficherErreur("La température doit être comprise entre 0 et 50 °C.");
            return null;
        }

        if (
            humidityInput.value.trim() === "" ||
            !Number.isFinite(humidite) ||
            humidite < 0 ||
            humidite > 100
        ) {
            afficherErreur("L’humidité doit être comprise entre 0 et 100 %.");
            return null;
        }

        effacerErreur();

        temperatureRange.value = temperature;
        humidityRange.value = humidite;

        return { temperature, humidite };
    }

    function afficherErreur(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("visible");
    }

    function effacerErreur() {
        errorMessage.textContent = "";
        errorMessage.classList.remove("visible");
    }

    // Calculer les degrés d'appartenance des entrées
    function calculerEntrees(temperature, humidite) {
        return {
            froide: temperatureFroide(temperature),
            moderee: temperatureModeree(temperature),
            chaude: temperatureChaude(temperature),
            faible: humiditeFaible(humidite),
            moyenne: humiditeMoyenne(humidite),
            elevee: humiditeElevee(humidite)
        };
    }

    // Inférence floue : ET = minimum, agrégation = maximum
    function appliquerRegles(degres) {
        const min = Math.min;
        const max = Math.max;

        // R1, R2, R3 : température froide -> confort mauvais
        const r1 = min(degres.froide, degres.faible);
        const r2 = min(degres.froide, degres.moyenne);
        const r3 = min(degres.froide, degres.elevee);

        // R4 : température modérée + humidité faible -> moyen
        const r4 = min(degres.moderee, degres.faible);

        // R5 : température modérée + humidité moyenne -> bon
        const r5 = min(degres.moderee, degres.moyenne);

        // R6 : température modérée + humidité élevée -> moyen
        const r6 = min(degres.moderee, degres.elevee);

        // R7, R8, R9 : température chaude -> confort mauvais
        const r7 = min(degres.chaude, degres.faible);
        const r8 = min(degres.chaude, degres.moyenne);
        const r9 = min(degres.chaude, degres.elevee);

        // Regrouper les règles ayant la même conclusion
        const mauvais = max(r1, r2, r3, r7, r8, r9);
        const moyen = max(r4, r6);
        const bon = r5;

        return { mauvais, moyen, bon };
    }

    // Calculer un score à partir des degrés de sortie
    function calculerScore(sorties) {
        const somme =
            sorties.mauvais + sorties.moyen + sorties.bon;

        if (somme === 0) {
            return 50;
        }

        const score =
            (sorties.mauvais * 20 +
             sorties.moyen * 50 +
             sorties.bon * 100) / somme;

        return Math.round(score);
    }

    // Afficher le score, le résultat et les couleurs correspondantes
    function afficherResultat(score, sorties, temperature, humidite) {
        const scoreCircle = document.getElementById("score-circle");
        const scoreElement = document.getElementById("score");
        const scoreProgress = document.getElementById("score-progress");
        const comfortLabel = document.getElementById("comfort-label");
        const description = document.getElementById("result-description");
        const adviceCard = document.getElementById("advice-card");
        const adviceIcon = document.getElementById("advice-icon");
        const adviceTitle = document.getElementById("advice-title");
        const advice = document.getElementById("advice");
        const houseTitle = document.getElementById("house-title");
        const houseMessage = document.getElementById("house-message");

        let categorie;
        let titre;
        let descriptionTexte;
        let couleur;
        let conseilTitre;
        let conseilTexte;
        let icone;
        let titreMaison;
        let messageMaison;

        if (score < 40) {
            categorie = "comfort-bad";
            titre = "Mauvais confort";
            couleur = "#d9534f";
            descriptionTexte =
                "Les conditions actuelles peuvent provoquer un inconfort thermique.";
            conseilTitre = "Amélioration recommandée";
            icone = "!";
            titreMaison = "Confort à améliorer";
            messageMaison =
                "Les conditions de température ou d’humidité s’éloignent de la zone de confort.";

            if (temperature < 20) {
                conseilTexte =
                    "La température est fraîche. Envisagez de réchauffer la pièce et de vérifier l’isolation.";
            } else if (temperature > 25) {
                conseilTexte =
                    "La température est élevée. Aérez la pièce si possible et limitez les sources de chaleur.";
            } else if (humidite < 30) {
                conseilTexte =
                    "L’air est relativement sec. Une humidification adaptée peut améliorer les conditions intérieures.";
            } else {
                conseilTexte =
                    "Vérifiez la ventilation et ajustez progressivement la température et l’humidité.";
            }
        } else if (score < 75) {
            categorie = "comfort-medium";
            titre = "Confort moyen";
            couleur = "#e69a32";
            descriptionTexte =
                "Les conditions sont acceptables, mais certains paramètres peuvent être améliorés.";
            conseilTitre = "Quelques ajustements";
            icone = "↗";
            titreMaison = "Confort intermédiaire";
            messageMaison =
                "L’environnement est relativement acceptable, avec une marge d’amélioration.";

            if (humidite > 60) {
                conseilTexte =
                    "Surveillez le taux d’humidité et améliorez la ventilation pour éviter une sensation d’air trop humide.";
            } else if (humidite < 40) {
                conseilTexte =
                    "Une légère adaptation de l’humidité et une température stable peuvent améliorer le confort.";
            } else {
                conseilTexte =
                    "Ajustez légèrement les conditions ambiantes afin de vous rapprocher d’une zone de confort optimale.";
            }
        } else {
            categorie = "comfort-good";
            titre = "Bon confort";
            couleur = "#2f8a61";
            descriptionTexte =
                "Les conditions évaluées sont favorables au confort thermique.";
            conseilTitre = "Conditions favorables";
            icone = "✓";
            conseilTexte =
                "Maintenez une température stable et une bonne ventilation pour préserver le confort intérieur.";
            titreMaison = "Un espace confortable";
            messageMaison =
                "Les conditions évaluées sont favorables à une sensation de confort thermique.";
        }

        scoreElement.textContent = score;
        scoreCircle.style.setProperty("--score-color", couleur);
        scoreCircle.style.setProperty("--score-angle", score + "%");
        scoreProgress.style.width = score + "%";
        scoreProgress.style.backgroundColor = couleur;

        comfortLabel.textContent = titre;
        comfortLabel.className = categorie;
        description.textContent = descriptionTexte;

        adviceCard.className = "card advice-card " + categorie;
        adviceIcon.textContent = icone;
        adviceTitle.textContent = conseilTitre;
        advice.textContent = conseilTexte;

        houseTitle.textContent = titreMaison;
        houseMessage.textContent = messageMaison;

        // Afficher les degrés des conclusions des règles
        afficherAppartenance("mauvais", sorties.mauvais);
        afficherAppartenance("moyen", sorties.moyen);
        afficherAppartenance("bon", sorties.bon);
    }

    // Fonction principale appelée lors de l'évaluation
    function evaluerConfort() {
        const parametres = lireParametres();

        if (!parametres) {
            return;
        }

        const { temperature, humidite } = parametres;

        // 1. Calcul des degrés d'appartenance des entrées
        const degres = calculerEntrees(temperature, humidite);

        afficherAppartenance("froide", degres.froide);
        afficherAppartenance("moderee", degres.moderee);
        afficherAppartenance("chaude", degres.chaude);

        afficherAppartenance("faible", degres.faible);
        afficherAppartenance("moyenne", degres.moyenne);
        afficherAppartenance("elevee", degres.elevee);

        // 2. Application des règles floues
        const sorties = appliquerRegles(degres);

        // 3. Calcul du score et affichage du résultat
        const score = calculerScore(sorties);

        afficherResultat(score, sorties, temperature, humidite);
    }

    // Le bouton lance l'évaluation
    evaluateButton.addEventListener("click", evaluerConfort);

    // Les résultats s'actualisent également quand une valeur change
    temperatureInput.addEventListener("input", evaluerConfort);
    temperatureRange.addEventListener("input", evaluerConfort);
    humidityInput.addEventListener("input", evaluerConfort);
    humidityRange.addEventListener("input", evaluerConfort);

    // Afficher les premiers résultats dès l'ouverture de l'application
    evaluerConfort();
});
