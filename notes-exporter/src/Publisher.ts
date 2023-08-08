import {
	TFile,
	Vault,
	Notice,
	Component,
	getLinkpath,
	MetadataCache,
} from "obsidian";

import { excaliDrawBundle, excalidraw } from "./constants";
import * as fse from "fs-extra";
import { getAPI } from "obsidian-dataview";
import LZString from "lz-string";
import * as os from "os";

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export default class Publisher {
	vault: Vault;
	metadataCache: MetadataCache;

	frontmatterRegex = /^\s*?---\n([\s\S]*?)\n---/g;
	codeFenceRegex = /`(.*?)`/g;
	codeBlockRegex = /```.*?\n[\s\S]+?```/g;
	excaliDrawRegex = /:\[\[(\d*?,\d*?)\],.*?\]\]/g;

	constructor(vault: Vault, metadataCache: MetadataCache) {
		this.vault = vault;
		this.metadataCache = metadataCache;
	}

	async exportNotes(): Promise<string> {
		const exportDir = this.getDirToExport();
		this.removeExportDir(exportDir);
		const files = this.vault.getMarkdownFiles();
		const failMessage = "Failed to export : ";
		const successMessage = "Successfully Exported";

		this.makeExportDirReady(exportDir);

		for (const file of files) {
			// const acceptedFile = file.path.contains('Living') && file.path.contains('_index')
			try {
				this.validateTitleAndPath(file);
				const text = await this.generateMarkdown(file);
				this.writeText(exportDir, file.path, text);
			} catch (e) {
				console.log(e);
				return `${failMessage}, name: ${file.name}, error:${e}`;
			}
		}
		return successMessage;
	}

	async generateMarkdown(file: TFile): Promise<string> {
		if (file.name.endsWith(".excalidraw.md")) {
			return this.generateExcalidrawMarkdown(file, true);
		}

		let text = await this.vault.cachedRead(file);
		text = await this.convertDataViews(text, file.path);
		text = await this.removeObsidianComments(text);
		text = await this.convertLinksToFullPath(text, file.path);
		return text;
	}

	getDirToExport(): string {
		//@ts-ignore
		// const vaultPath = normalizePath(`${this.vault.adapter.basePath}`)
		//
		// const dirName = 'notes-export'
		// return `/${vaultPath}/${dirName}`
		return `${os.homedir()}/notes-export`;
	}

	makeExportDirReady(exportDir: string) {
		fse.ensureDirSync(exportDir);
		fse.emptydirSync(exportDir);
	}

	removeExportDir(exportDir: string) {
		fse.removeSync(exportDir);
	}

	writeText(dirPath: string, filePath: string, content: string) {
		filePath = `${dirPath}/${filePath}`;
		fse.ensureFileSync(filePath);
		fse.truncateSync(filePath);
		fse.writeFileSync(filePath, content);
	}

	async removeObsidianComments(text: string): Promise<string> {
		const obsidianCommentsRegex = /%%.+?%%/gms;
		const obsidianCommentsMatches = text.match(obsidianCommentsRegex);
		const codeBlocks = text.match(this.codeBlockRegex) || [];
		const codeFences = text.match(this.codeFenceRegex) || [];
		const excalidraw = text.match(this.excaliDrawRegex) || [];

		if (obsidianCommentsMatches) {
			for (const commentMatch of obsidianCommentsMatches) {
				//If comment is in a code block, code fence, or excalidrawing, leave it in
				if (
					codeBlocks.findIndex((x) => x.contains(commentMatch)) > -1
				) {
					continue;
				}
				if (
					codeFences.findIndex((x) => x.contains(commentMatch)) > -1
				) {
					continue;
				}

				if (
					excalidraw.findIndex((x) => x.contains(commentMatch)) > -1
				) {
					continue;
				}
				text = text.replace(commentMatch, "");
			}
		}

		return text;
	}

	async convertDataViews(text: string, path: string): Promise<string> {
		let replacedText = text;
		const dataViewRegex = /```dataview\s(.+?)```/gms;
		const dvApi = getAPI();
		if (!dvApi) return replacedText;
		const matches = text.matchAll(dataViewRegex);

		const dataviewJsPrefix = dvApi.settings.dataviewJsKeyword;
		const dataViewJsRegex = new RegExp(
			"```" + escapeRegExp(dataviewJsPrefix) + "\\s(.+?)```",
			"gsm"
		);
		const dataviewJsMatches = text.matchAll(dataViewJsRegex);

		const inlineQueryPrefix = dvApi.settings.inlineQueryPrefix;
		const inlineDataViewRegex = new RegExp(
			"`" + escapeRegExp(inlineQueryPrefix) + "(.+?)`",
			"gsm"
		);
		const inlineMatches = text.matchAll(inlineDataViewRegex);

		const inlineJsQueryPrefix = dvApi.settings.inlineJsQueryPrefix;
		const inlineJsDataViewRegex = new RegExp(
			"`" + escapeRegExp(inlineJsQueryPrefix) + "(.+?)`",
			"gsm"
		);
		const inlineJsMatches = text.matchAll(inlineJsDataViewRegex);

		if (
			!matches &&
			!inlineMatches &&
			!dataviewJsMatches &&
			!inlineJsMatches
		)
			return;

		//Code block queries
		for (const queryBlock of matches) {
			try {
				const block = queryBlock[0];
				const query = queryBlock[1];
				const markdown = await dvApi.tryQueryMarkdown(query, path);
				replacedText = replacedText.replace(block, markdown);
			} catch (e) {
				console.log(e);
				new Notice(
					"Unable to render dataview query. Please update the dataview plugin to the latest version."
				);
				return queryBlock[0];
			}
		}

		for (const queryBlock of dataviewJsMatches) {
			try {
				const block = queryBlock[0];
				const query = queryBlock[1];

				const div = createEl("div");
				const component = new Component();
				await dvApi.executeJs(query, div, component, path);
				component.load();

				replacedText = replacedText.replace(block, div.innerHTML);
			} catch (e) {
				console.log(e);
				new Notice(
					"Unable to render dataviewjs query. Please update the dataview plugin to the latest version."
				);
				return queryBlock[0];
			}
		}

		//Inline queries
		for (const inlineQuery of inlineMatches) {
			try {
				const code = inlineQuery[0];
				const query = inlineQuery[1];
				const dataviewResult = dvApi.tryEvaluate(query, {
					this: dvApi.page(path),
				});
				if (dataviewResult) {
					replacedText = replacedText.replace(
						code,
						dataviewResult.toString()
					);
				}
			} catch (e) {
				console.log(e);
				new Notice(
					"Unable to render inline dataview query. Please update the dataview plugin to the latest version."
				);
				return inlineQuery[0];
			}
		}

		for (const inlineJsQuery of inlineJsMatches) {
			try {
				const code = inlineJsQuery[0];
				const query = inlineJsQuery[1];

				const div = createEl("div");
				const component = new Component();
				await dvApi.executeJs(query, div, component, path);
				component.load();

				replacedText = replacedText.replace(code, div.innerHTML);
			} catch (e) {
				console.log(e);
				new Notice(
					"Unable to render inline dataviewjs query. Please update the dataview plugin to the latest version."
				);
				return inlineJsQuery[0];
			}
		}

		return replacedText;
	}

	validateTitleAndPath(file: TFile) {
		const frontMatter = this.metadataCache.getCache(file.path).frontmatter;
		if (!frontMatter.title) {
			new Notice(`TitleNotFound - ${file.name}`);
			throw new Error("TitleNotFoundError");
		}

		let fPath = file.path;

		// removing .md
		fPath = fPath.slice(0, -3);

		// removing known special chars
		fPath = fPath.replaceAll("/", "");
		fPath = fPath.replaceAll("-", "");
		if (!fPath.endsWith("_index") && !fPath.match(/^[a-z0-9]+$/i)) {
			throw new Error("TitleUnsanitizedError");
		}
	}

	stripAwayCodeFencesAndFrontmatter(text: string): string {
		let textToBeProcessed = text;
		textToBeProcessed = textToBeProcessed.replace(this.excaliDrawRegex, "");
		textToBeProcessed = textToBeProcessed.replace(this.codeBlockRegex, "");
		textToBeProcessed = textToBeProcessed.replace(this.codeFenceRegex, "");
		textToBeProcessed = textToBeProcessed.replace(
			this.frontmatterRegex,
			""
		);

		return textToBeProcessed;
	}

	async convertLinksToFullPath(
		text: string,
		filePath: string
	): Promise<string> {
		let convertedText = text;

		const textToBeProcessed = this.stripAwayCodeFencesAndFrontmatter(text);

		const linkedFileRegex = /\[\[(.+?)\]\]/g;
		const linkedFileMatches = textToBeProcessed.match(linkedFileRegex);

		if (linkedFileMatches) {
			for (const linkMatch of linkedFileMatches) {
				try {
					const textInsideBrackets = linkMatch.substring(
						linkMatch.indexOf("[") + 2,
						linkMatch.lastIndexOf("]") - 1
					);
					let [linkedFileName, prettyName] =
						textInsideBrackets.split("|");

					// sanitizing names

					if (linkedFileName.endsWith("\\")) {
						linkedFileName = linkedFileName.substring(
							0,
							linkedFileName.length - 1
						);
					}

					prettyName = prettyName || linkedFileName;

					linkedFileName = linkedFileName.replace(/%20/g, " ");
					linkedFileName = linkedFileName.trim();
					prettyName = prettyName.trim();

					let headerPath = "";
					if (linkedFileName.includes("#")) {
						const headerSplit = linkedFileName.split("#");
						linkedFileName = headerSplit[0];
						//currently no support for linking to nested heading with multiple #s
						headerPath =
							headerSplit.length > 1 ? `#${headerSplit[1]}` : "";
					}
					const fullLinkedFilePath = getLinkpath(linkedFileName);
					const linkedFile = this.metadataCache.getFirstLinkpathDest(
						fullLinkedFilePath,
						filePath
					);
					let linkPath = "";
					if (!linkedFile) {
						linkPath = `${linkedFileName}${headerPath}`;
						linkPath = linkPath.trim();
					} else {
						let extensionlessPath = linkedFile.path;
						if (linkedFile.extension === "md") {
							extensionlessPath = linkedFile.path.substring(
								0,
								linkedFile.path.lastIndexOf(".")
							);
						}
						const SEPARATOR = "-";

						linkPath = linkPath.trim();
						linkPath = `${extensionlessPath}${headerPath}`;
						linkPath = linkPath.toLowerCase();
						linkPath = linkPath.replace(/\s/g, SEPARATOR);
					}

					let replaceValue = `[${prettyName}](/${linkPath})`;
					linkedFileName = linkedFileName.trim();

					convertedText = convertedText.replace(
						linkMatch,
						replaceValue
					);
				} catch (e) {
					console.log(e);

					new Notice(`Error - ${e}`);
					continue;
				}
			}
		}

		new Notice("Completed Exporting Notes");
		return convertedText;
	}

	async generateExcalidrawMarkdown(
		file: TFile,
		includeExcaliDrawJs: boolean,
		idAppendage = "",
		includeFrontMatter = true
	): Promise<string> {
		if (!file.name.endsWith(".excalidraw.md")) return "";

		const fileText = await this.vault.cachedRead(file);

		const isCompressed = fileText.includes("```compressed-json");
		const start =
			fileText.indexOf(isCompressed ? "```compressed-json" : "```json") +
			(isCompressed ? "```compressed-json" : "```json").length;
		const end = fileText.lastIndexOf("```");
		const excaliDrawJson = JSON.parse(
			isCompressed
				? LZString.decompressFromBase64(
						fileText.slice(start, end).replace(/[\n\r]/g, "")
				  )
				: fileText.slice(start, end)
		);

		const drawingId =
			file.name.split(" ").join("_").replace(".", "") + idAppendage;
		let excaliDrawCode = "";
		if (includeExcaliDrawJs) {
			excaliDrawCode += excaliDrawBundle;
		}

		excaliDrawCode += excalidraw(JSON.stringify(excaliDrawJson), drawingId);

		return excaliDrawCode;
	}
}
