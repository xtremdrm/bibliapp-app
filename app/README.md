# BibliApp

Sagrada Biblia (versión de la Conferencia Episcopal Española), oraciones, rosario,
calendario litúrgico y directorio de parroquias. Aplicación Angular + Ionic que funciona
sin conexión y se empaqueta para Android con Capacitor.

## Stack

Angular 21 (Signals, OnPush, rutas diferidas) · TypeScript · Ionic · Capacitor · Leaflet · SCSS

## Desarrollo

```bash
npm install
npm start          # http://localhost:4200
```

## Compilación

```bash
npm run build:web   # build + service worker con caché versionada
npm run build:site  # portada (web/) + app en /app, salida en dist/site
```

## Estructura

- `src/app/features/*`: Biblia, oraciones, ánimo, calendario, iglesias, editor de versículos
- `src/assets/bible`: `books.json` (índice de libros) y un JSON por libro
- `scripts/`: precaché del service worker y construcción de datos
- `../web`: portada pública con la demo embebida

## Texto bíblico

El texto de la Sagrada Biblia tiene derechos reservados y no se distribuye en este
repositorio. Solo se incluye `src/assets/bible/books.json`, con los nombres de los libros
y el número de capítulos.

Para ejecutar la app con contenido, coloca en `src/assets/bible/` un fichero por libro
llamado `bible_<id>.json`, donde `<id>` es el identificador de `books.json` (1 a 73):

```json
{ "1": [{ "v": 1, "t": "Texto del versículo" }], "2": [] }
```

Las claves son los números de capítulo; `v` es el número de versículo y `t` su texto.
La demo desplegada sí incluye el texto completo.

## Decisiones

- Biblia en un JSON por libro, con caché y deduplicación de peticiones en `BibleService`.
- El dataset de versículos por ánimo guarda referencias, no texto.
- Parroquias indexadas en memoria por código postal, municipio y nombre.
- Service worker propio: red primero para navegación, caché primero para el resto.

## Límites

Sin servidor; Iglesias está en beta con ubicaciones aproximadas; solo tema oscuro.

## Créditos

Texto bíblico © Conferencia Episcopal Española. Detalle de licencias en la pantalla
«Créditos y avisos legales».
