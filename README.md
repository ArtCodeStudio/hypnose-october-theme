# Hypnose OctoberCMS Theme

This is a OctoberCMS v1.x Theme build for [Fachzentrum für ursachenorientierte Hypnose](https://hypnozentrum.de/).

## Build

Install Node.js with [NVM](https://github.com/nvm-sh/nvm).

After this install yarn 3 with `npm install -g yarn@berry`.

Clone this repository with it's submpdules:

```bash
git clone --recurse-submodules -j8 https://github.com/ArtCodeStudio/hypnose-october-theme.git
cd hypnose-october-theme
```

If you have already cloned out this repository without the submodules, you can also clone the submodules later:

```bash
git submodule update --init
```

After this you need to install the dependencies:

```bash
yarn install
```

Now you can build the theme with:

```bash
yarn run build
```

## Development

Instead of build the theme each time you have changed something you can watch the theme with:

```bash
yarn run watch
```
