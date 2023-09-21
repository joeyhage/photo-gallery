# Photo gallery

This project was created using Node.js v18. You must use v16.14 or later to run it.

## Instructions

1. Optionally enter an Album ID to view photos from. Must be a non-negative integer. Default is all albums.
2. Optionally enter the number of photos you want to skip from the beginning of the album. Must be a non-negative integer. Default is 0.
3. Optionally enter the number of photos you want to view at once. Must be a non-negative integer less than or equal to 100. Default is 25.
4. Click `View Photos`.
5. Use the arrows on screen to navigate forwards and backwards.

## Local development server

This enables hot-reloading when files change. However, data caching is turned off.

```shell
git clone https://github.com/joeyhage/photo-gallery.git;
cd photo-gallery;
npm install;
npm run dev;
```

Open [http://localhost:3000](http://localhost:3000)

## Running locally

Caches JSON and images for 1 hour so pages load faster.

```shell
git clone https://github.com/joeyhage/photo-gallery.git;
cd photo-gallery;
npm install;
npm run build;
npm start;
```

Open [http://localhost:3000](http://localhost:3000)
