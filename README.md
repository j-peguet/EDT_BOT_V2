# EDT BOT V2
Repo du bot V2 de l'epsi.

## Installation
Récupération des nodes modules.
```bash
yarn install
# ou
npm install
```

## Configuration des .env
### En local
Crée un fichier `.env.local` reprenant les mêmes informations que le fichier .`env`

Modifier ensuite les informations entre <>. 
```bash
yarn dev
# ou
npm dev
```

### En production
Crée un fichier `.env.prod` reprenant les mêmes informations que le fichier .`env`

Modifier ensuite les informations entre <>.
```bash
yarn start
# ou
npm start
```

## Deploiement des commandes sur le serveur
Pour que les commandes soient disponibles sur le serveur il est nécessaire de les déployer.

```bash
cd EDT_BOT_V2/
node deploy-commands.js
```