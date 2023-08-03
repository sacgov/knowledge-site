## Setup

This setup uses Hugo and Custom Obsidian Plugins to Deploy.

## How Hugo Setup Works

The setup uses Git Modules. Themes are in themes folder. This setup use hugo-book theme.
Few layouts are overriden to make the theme white-red.
`Backlinks.html` in `layouts/partials` implements backlinks below the TOC on the side in the page layout.

Link Previews work from `static/link-preview.js`. These are included in theme's `hugo.toml`

## How to run the setup locally



## Debugging Hugo

Check [Deubugging](https://gohugo.io/templates/template-debugging/)
`{{ printf "%#v" $.Site }}`




## How to Deploy

1. Use export-notes commands to export current obsidian content ot a directory in home folder.
2. Run `./check.sh` to move the exported noted to the content folder. It also show the git status of the content.
3. Run `./commit.sh` to publish the content to github.
4. Github website is connected to Netlify and would automatically publishes [Sachin Govind's Notes](https://notes.sachingovind.com)

## Importing to Notion
1. Run `notion-import.sh`.
2. Import the folder into Notion using Text and Markdown importer in Notion

## Custom Obsidian Plugins

### obsidian-digital-garden
obsidian-digital-garden prepares the markdown files and exports to  the folder `${os.homedir()}/notes-export`

The plugin adds a command export-notes to obsidian's command palette

### obsidian-link-converter

Converts wikilinks to full path markdown style links



