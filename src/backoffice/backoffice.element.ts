import { defineElement } from '@umbraco-ui/uui-base/lib/registration';
import { UUITextStyles } from '@umbraco-ui/uui-css/lib';
import { css, html } from 'lit';
import { UmbStoreExtensionInitializer } from '../core/store-extension-initializer';
import {
	UmbBackofficeContext,
	UMB_BACKOFFICE_CONTEXT_TOKEN,
} from './shared/components/backoffice-frame/backoffice.context';
import { UmbExtensionInitializer } from './packages/repository/server-extension.controller';
import { umbExtensionsRegistry } from '@umbraco-cms/backoffice/extensions-api';
import { UmbModalContext, UMB_MODAL_CONTEXT_TOKEN } from '@umbraco-cms/backoffice/modal';
import { UmbNotificationContext, UMB_NOTIFICATION_CONTEXT_TOKEN } from '@umbraco-cms/backoffice/notification';
import { UmbEntryPointExtensionInitializer } from '@umbraco-cms/backoffice/extensions-registry';
import { UmbLitElement } from '@umbraco-cms/internal/lit-element';

const CORE_PACKAGES = [
	import('./shared/umbraco-package'),
	import('./settings/umbraco-package'),
	import('./documents/umbraco-package'),
	import('./media/umbraco-package'),
	import('./members/umbraco-package'),
	import('./translation/umbraco-package'),
	import('./users/umbraco-package'),
	import('./packages/umbraco-package'),
	import('./search/umbraco-package'),
	import('./templating/umbraco-package'),
];

@defineElement('umb-backoffice')
export class UmbBackofficeElement extends UmbLitElement {
	

	constructor() {
		super();
		this.provideContext(UMB_MODAL_CONTEXT_TOKEN, new UmbModalContext(this));
		this.provideContext(UMB_NOTIFICATION_CONTEXT_TOKEN, new UmbNotificationContext());
		this.provideContext(UMB_BACKOFFICE_CONTEXT_TOKEN, new UmbBackofficeContext());
		new UmbEntryPointExtensionInitializer(this, umbExtensionsRegistry);
		new UmbStoreExtensionInitializer(this);
		new UmbExtensionInitializer(this, umbExtensionsRegistry, CORE_PACKAGES);
	}

	render() {
		return html`
			<umb-backoffice-header></umb-backoffice-header>
			<umb-backoffice-main></umb-backoffice-main>
			<umb-backoffice-notification-container></umb-backoffice-notification-container>
			<umb-backoffice-modal-container></umb-backoffice-modal-container>
		`;
	}
	
	static styles = [
		UUITextStyles,
		css`
			:host {
				display: flex;
				flex-direction: column;
				height: 100%;
				width: 100%;
				color: var(--uui-color-text);
				font-size: 14px;
				box-sizing: border-box;
			}
			umb-backoffice-modal-container {
				z-index: 1000;
			}
		`,
	];
}

export default UmbBackofficeElement;
declare global {
	interface HTMLElementTagNameMap {
		'umb-backoffice': UmbBackofficeElement;
	}
}
