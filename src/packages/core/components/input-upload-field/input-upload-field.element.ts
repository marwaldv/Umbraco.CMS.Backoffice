import { UmbId } from '../../index.js';
import { TemporaryFileQueueItem, UmbTemporaryFileManager } from '../../temporary-file/temporary-file-manager.class.js';
import {
	css,
	html,
	nothing,
	ifDefined,
	customElement,
	property,
	query,
	state,
	repeat,
} from '@umbraco-cms/backoffice/external/lit';
import { FormControlMixin } from '@umbraco-cms/backoffice/external/uui';
import type { UUIFileDropzoneElement, UUIFileDropzoneEvent } from '@umbraco-cms/backoffice/external/uui';
import { UmbLitElement } from '@umbraco-cms/internal/lit-element';

import './input-upload-field-file.element.js';

@customElement('umb-input-upload-field')
export class UmbInputUploadFieldElement extends FormControlMixin(UmbLitElement) {
	private _keys: Array<string> = [];
	/**
	 * @description Keys to the files that belong to this upload field.
	 * @type {Array<String>}
	 * @default []
	 */
	@property({ type: Array<string> })
	public set keys(fileKeys: Array<string>) {
		this._keys = fileKeys;
		super.value = this._keys.join(',');
	}
	public get keys(): Array<string> {
		return this._keys;
	}

	/**
	 * @description Allowed file extensions. If left empty, all are allowed.
	 * @type {Array<String>}
	 * @default undefined
	 */
	@property({ type: Array<string> })
	fileExtensions?: Array<string>;

	/**
	 * @description Allows the user to upload multiple files.
	 * @type {Boolean}
	 * @default false
	 * @attr
	 */
	@property({ type: Boolean })
	multiple = false;

	@state()
	_currentFiles: Array<TemporaryFileQueueItem> = [];

	@state()
	extensions?: string[];

	@query('#dropzone')
	private _dropzone?: UUIFileDropzoneElement;

	#manager;

	protected getFormElement() {
		return undefined;
	}

	constructor() {
		super();
		this.#manager = new UmbTemporaryFileManager(this);

		this.observe(this.#manager.isReady, (value) => (this.error = !value));
		this.observe(this.#manager.items, (value) => (this._currentFiles = value));
	}

	connectedCallback(): void {
		super.connectedCallback();
		this.#setExtensions();
	}

	#setExtensions() {
		if (!this.fileExtensions?.length) return;

		this.extensions = this.fileExtensions.map((extension) => {
			return `.${extension}`;
		});
	}

	#onUpload(e: UUIFileDropzoneEvent) {
		const files: File[] = e.detail.files;

		if (!files?.length) return;

		// TODO: Should we validate the mimetype some how?
		this.#setFiles(files);
	}

	#setFiles(files: File[]) {
		const items = files.map(
			(file): TemporaryFileQueueItem => ({
				id: UmbId.new(),
				file,
				status: 'waiting',
			}),
		);
		this.#manager.upload(items);

		this.keys = items.map((item) => item.id);
		this.value = this.keys.join(',');

		this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
	}

	#handleBrowse() {
		if (!this._dropzone) return;
		this._dropzone.browse();
	}

	render() {
		return html`${this.#renderUploadedFiles()} ${this.#renderDropzone()}${this.#renderButtonRemove()}`;
	}

	//TODO When the property editor gets saved, it seems that the property editor gets the file path from the server rather than key/id.
	// Image/files needs to be displayed from a previous save (not just when it just got uploaded).
	#renderDropzone() {
		if (!this.multiple && this._currentFiles.length) return nothing;
		return html`
			<uui-file-dropzone
				id="dropzone"
				label="dropzone"
				@change="${this.#onUpload}"
				accept="${ifDefined(this.extensions?.join(', '))}"
				?multiple="${this.multiple}">
				<uui-button label="upload" @click="${this.#handleBrowse}">Upload file here</uui-button>
			</uui-file-dropzone>
		`;
	}
	#renderUploadedFiles() {
		if (!this._currentFiles.length) return nothing;
		return html`<div id="wrapper">
			${repeat(
				this._currentFiles,
				(item) => item.id + item.status,
				(item) =>
					html`<div style="position:relative;">
						<umb-input-upload-field-file .file=${item.file as any}></umb-input-upload-field-file>
						${item.status === 'waiting' ? html`<umb-temporary-file-badge></umb-temporary-file-badge>` : nothing}
					</div>`,
			)}
		</div>`;
	}

	#renderButtonRemove() {
		if (!this._currentFiles.length) return;
		return html`<uui-button compact @click=${this.#handleRemove} label="Remove files">
			<uui-icon name="icon-trash"></uui-icon> Remove file(s)
		</uui-button>`;
	}

	#handleRemove() {
		const ids = this._currentFiles.map((item) => item.id) as string[];
		this.#manager.remove(ids);

		this.dispatchEvent(new CustomEvent('change', { bubbles: true }));
	}

	static styles = [
		css`
			uui-icon {
				vertical-align: sub;
				margin-right: var(--uui-size-space-4);
			}

			umb-input-upload-field-file {
				display: flex;
				justify-content: center;
				align-items: center;
				width: 200px;
				height: 200px;
				box-sizing: border-box;
				padding: var(--uui-size-space-4);
				border: 1px solid var(--uui-color-border);
			}

			#wrapper {
				display: grid;
				grid-template-columns: repeat(auto-fit, 200px);
				gap: var(--uui-size-space-4);
			}
		`,
	];
}

export default UmbInputUploadFieldElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-input-upload-field': UmbInputUploadFieldElement;
	}
}
