import { Plugin, ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MetascanDashboard } from './view';

export const VIEW_TYPE_METASCAN = "metascan-pro-view";

export default class MetascanPlugin extends Plugin {
	async onload() {
		this.registerView(
			VIEW_TYPE_METASCAN,
			(leaf) => new MetascanView(leaf)
		);

		this.addCommand({
			id: 'open-metascan',
			name: 'Open Metascan Pro',
			callback: () => {
				this.activateView();
			}
		});

		this.addRibbonIcon('shield-check', 'Metascan Pro', () => {
			this.activateView();
		});
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_METASCAN);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeaf(true);
			await leaf.setViewState({
				type: VIEW_TYPE_METASCAN,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}
}

class MetascanView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_METASCAN;
	}

	getDisplayText() {
		return "Metascan Pro";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		
		this.root = createRoot(container);
		this.root.render(
			<React.StrictMode>
				<MetascanDashboard app={this.app} />
			</React.StrictMode>
		);
	}

	async onClose() {
		if (this.root) {
			this.root.unmount();
		}
	}
}
