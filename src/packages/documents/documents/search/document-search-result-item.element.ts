import type { UmbSearchResultItemModel } from '@umbraco-cms/backoffice/search';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, customElement, html, property } from '@umbraco-cms/backoffice/external/lit';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';

const elementName = 'umb-document-search-result-item';
@customElement(elementName)
export class UmbDocumentSearchResultItemElement extends UmbLitElement {
	@property({ type: Object })
	item?: UmbSearchResultItemModel;

	render() {
		return html`
			<div>ICON</div>
			<div>${this.item?.name}</div>
		`;
	}

	static styles = [
		UmbTextStyles,
		css`
			:host {
				display: flex;
				gap: 12px;
			}
		`,
	];
}

export { UmbDocumentSearchResultItemElement as element };

declare global {
	interface HTMLElementTagNameMap {
		[elementName]: UmbDocumentSearchResultItemElement;
	}
}
