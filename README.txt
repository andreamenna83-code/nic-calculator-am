Nic Calculator AM — PWA
=======================

Come pubblicarla (opzione facile: GitHub Pages)
1) Crea un nuovo repository su GitHub (pubblico) chiamato, ad esempio, nic-calculator-am
2) Carica TUTTI i file di questa cartella nella root del repo
3) Vai su Settings -> Pages -> Source: "Deploy from a branch", Branch: "main", Folder: "/root"
4) Attendi il deploy, poi apri l'URL indicato (https://<tuo-utente>.github.io/nic-calculator-am/)
5) Su iPhone Safari: Condividi -> "Aggiungi a Schermata Home" (sarà installata come app)

Hosting su dominio tuo (Netlify, Vercel, static host): basta caricare i file così come sono.

Nota
- L'app parte sulla scheda 20 -> 60
- Offline-ready grazie al service worker (cache 'nic-am-v1')