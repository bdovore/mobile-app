# Authentification et profil natifs

Branche de développement : `codex/auth-profil`. Le backend PHP doit être déployé et activé avant de publier cette version mobile. Aucune suppression des anciens points d'entrée n'est requise pour ce déploiement.

Le guide complet, le contrat JSON, la migration SQL, les contrôles de coexistence et le retour arrière sont dans le dépôt PHP : `docs/authentification-mobile.md`.

## Préparer une build

```sh
npm install --legacy-peer-deps
cd ios
pod install --no-repo-update
```

Le projet possède un conflit de peer dependencies préexistant entre les versions release candidate de RNEUI ; l'installation conserve sa résolution historique. La nouvelle dépendance est épinglée à `react-native-keychain` 10.0.0. Le lockfile CocoaPods inclut RNKeychain ; le lockfile npm est ignoré par les conventions existantes du dépôt.

`api/Config.js` contient l'URL du backend. Pour une build de préproduction, y renseigner uniquement une URL HTTPS de l'environnement de test ; ne jamais ajouter de secret d'API à l'app. Rétablir l'URL de production avant publication.

## Comportement

- Le menu de connexion existant affiche le profil natif quand une session est présente.
- Inscription, connexion, confirmation, récupération et modifications de compte sont natives.
- Les appels métier existants utilisent le Bearer. Aucun jeton de session n'est transmis dans une URL, même pour ouvrir les contributions web.
- La première ouverture efface les anciens secrets AsyncStorage et demande une reconnexion, en conservant les données de collection du même compte.
- L'identité de la collection locale est stockée séparément du jeton. Un changement de compte nettoie ce cache avant d'activer la nouvelle session.
- La session et le dernier profil sont conservés dans Keychain/Keystore. Une nouvelle installation ne restaure pas une ancienne entrée Keychain survivante à une désinstallation.
- Hors ligne, consulter la collection et le profil chargés reste possible. Les modifications de compte nécessitent Internet.
- Les erreurs 401 de session ramènent à la connexion ; un mauvais mot de passe de confirmation ou une indisponibilité 503 ne supprime pas une session valide.
- Les réponses d'un ancien compte ou d'une requête antérieure à la déconnexion ne doivent pas rétablir son identité.

## Tests

```sh
npx jest --config jest.config.js __tests__/AuthManager-test.js __tests__/AccountScreens-test.js --runInBand --watchman=false
npx eslint api/AuthManager.js api/Config.js components/AccountForm.js screens/LoginScreen.js screens/ProfileScreen.js __tests__/AuthManager-test.js __tests__/AccountScreens-test.js
```

Le fichier de configuration Jest est explicite parce que le dépôt possède aussi une configuration dans `package.json`.

Le test général préexistant `App-test.js` échoue à charger `RNGestureHandlerModule` dans Jest, dès le premier import d'`App.tsx` (inchangé). Les tests ciblés de l'authentification et des écrans sont exécutés séparément ; ils ne nécessitent pas de module natif réel.

Compilations locales sans publication ni signature de distribution :

```sh
cd ios
xcodebuild -workspace bdovore.xcworkspace -scheme bdovore -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /private/tmp/bdovore-auth-derived CODE_SIGNING_ALLOWED=NO IPHONEOS_DEPLOYMENT_TARGET=15.1 build
```

L'override de cible reprend le minimum déclaré par le Podfile et évite le refus des anciennes cibles minimales des Pods sous le Xcode installé.

```sh
cd android
./gradlew :app:assembleDebug '-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g' --max-workers=2
```

Vérifier ensuite sur appareils iOS et Android l'envoi SMTP et les parcours contre le backend activé. Les tests automatisés utilisent des réponses simulées et ne contactent pas les comptes réels. Avant les stores, incrémenter les numéros de version/build suivant le processus habituel, puis publier progressivement ; les numéros de distribution ne sont pas modifiés dans cette branche.
