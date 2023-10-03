import { UmbModalContext } from './modal-context.js';
import { ManifestModal, umbExtensionsRegistry } from '@umbraco-cms/backoffice/extension-registry';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { CSSResultGroup, html, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/internal/lit-element';
import { BehaviorSubject } from '@umbraco-cms/backoffice/external/rxjs';
import { UmbObserverController } from '@umbraco-cms/backoffice/observable-api';
import { UUIDialogElement, UUIModalDialogElement, UUIModalSidebarElement } from '@umbraco-cms/backoffice/external/uui';
import { UmbRouterSlotElement } from '@umbraco-cms/backoffice/router';
import { createExtensionElement } from '@umbraco-cms/backoffice/extension-api';
import { UmbContextProvider, UmbContextToken } from '@umbraco-cms/backoffice/context-api';

@customElement('umb-modal')
export class UmbModalElement extends UmbLitElement {
	#modalHandler: UmbModalContext | undefined;
	public get modalHandler(): UmbModalContext | undefined {
		return this.#modalHandler;
	}
	public set modalHandler(value: UmbModalContext) {
		this.#modalHandler = value;

		if (!value) {
			this.#destroy();
			return;
		}

		this.#createModalElement();
	}

	public modalElement?: UUIModalDialogElement | UUIModalSidebarElement;

	#innerElement = new BehaviorSubject<HTMLElement | undefined>(undefined);

	#modalExtensionObserver?: UmbObserverController<ManifestModal | undefined>;
	#modalRouterElement: UmbRouterSlotElement = document.createElement('umb-router-slot');

	#createModalElement() {
		if (!this.#modalHandler) return;

		this.modalElement = this.#createContainerElement();

		this.#modalHandler.onSubmit().then(
			() => {
				this.modalElement?.close();
			},
			() => {
				this.modalElement?.close();
			},
		);

		/**
		 *
		 * Maybe we could just get a Modal Router Slot. But it needs to have the ability to actually inject via slot. so the modal inner element can be within.
		 *
		 */
		if (this.#modalHandler.router) {
			this.#modalRouterElement.routes = [
				{
					path: '',
					component: document.createElement('slot'),
				},
			];
			this.#modalRouterElement.parent = this.#modalHandler.router;
		}

		this.modalElement.appendChild(this.#modalRouterElement);
		this.#observeModal(this.#modalHandler.alias.toString());

		const provider = new UmbContextProvider(this.modalElement, UMB_MODAL_CONTEXT_TOKEN, this.#modalHandler);
		provider.hostConnected();
	}

	#createContainerElement() {
		return this.#modalHandler!.type === 'sidebar' ? this.#createSidebarElement() : this.#createDialogElement();
	}

	#createSidebarElement() {
		const sidebarElement = document.createElement('uui-modal-sidebar');
		sidebarElement.size = this.#modalHandler!.size;
		return sidebarElement;
	}

	#createDialogElement() {
		const modalDialogElement = document.createElement('uui-modal-dialog');
		const dialogElement: UUIDialogElement = document.createElement('uui-dialog');
		modalDialogElement.appendChild(dialogElement);
		return modalDialogElement;
	}

	#observeModal(alias: string) {
		this.#modalExtensionObserver?.destroy();

		this.observe(umbExtensionsRegistry.getByTypeAndAlias('modal', alias), async (manifest) => {
			this.#removeInnerElement();

			if (manifest) {
				const innerElement = await this.#createInnerElement(manifest);
				if (innerElement) {
					this.#appendInnerElement(innerElement);
				}
			}
		});
	}

	async #createInnerElement(manifest: ManifestModal) {
		// TODO: add inner fallback element if no extension element is found
		const innerElement = (await createExtensionElement(manifest)) as any;

		if (innerElement) {
			innerElement.data = this.#modalHandler!.data;
			innerElement.modalContext = this.#modalHandler;
			innerElement.manifest = manifest;
		}

		return innerElement;
	}

	#appendInnerElement(element: HTMLElement) {
		this.#modalRouterElement.appendChild(element);
		this.#innerElement.next(element);
	}

	#removeInnerElement() {
		const innerElement = this.#innerElement.getValue();
		if (innerElement) {
			this.#modalRouterElement.removeChild(innerElement);
			this.#innerElement.next(undefined);
		}
	}

	render() {
		return html`${this.modalElement}`;
	}

	#destroy() {
		this.#innerElement.complete();
		this.#modalExtensionObserver?.destroy();
		this.#modalExtensionObserver = undefined;
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.#destroy();
	}

	static styles: CSSResultGroup = [UmbTextStyles];
}

declare global {
	interface HTMLElementTagNameMap {
		'umb-modal': UmbModalElement;
	}
}

export const UMB_MODAL_CONTEXT_TOKEN = new UmbContextToken<UmbModalContext>('UmbModalContext');
