import { Notice, Plugin} from 'obsidian';
import Publisher from 'src/Publisher';

export default class DigitalGarden extends Plugin {


	async onload() {
		await this.addCommands();
	}

	async addCommands() {

		this.addCommand({
			id: 'export-notes',
			name: 'Export Notes',
			callback: async () => {
				await this.exportNotes();
			}
		});

	}


	async exportNotes() {
		try {
			const {vault, metadataCache} = this.app;


			const publisher = new Publisher(vault, metadataCache);
			const publishSuccessfulMessage = await publisher.exportNotes();

			new Notice(publishSuccessfulMessage);

		} catch (e) {
			console.log(e)
			new Notice(`System Error${e}`,10000)
		}
	}

	async debug(){
		try {
			const {vault, metadataCache} = this.app;

			const publisher = new Publisher(vault, metadataCache);
			const exportDir = publisher.getDirToExport()
			publisher.removeExportDir(exportDir)

		}catch (e) {
			console.log(e)
			new Notice(e)
		}

	}

}


