import { Modal } from "@4site/engrid-scripts";
import { Product } from "./shop.types";

export default class ProductDetailsModal extends Modal {
  private product: Product | null = null;

  constructor() {
    super({
      onClickOutside: "close",
      addCloseButton: false,
      closeButtonLabel: "Close",
      customClass: "product-details-modal",
      showCloseX: true,
    });
  }

  getModalContent(): string {
    return `
      <div class="product-details-modal__content">
        <div class="product-details-modal__image-container">
          <img
            src="${this.product ? this.product.image : ''}"
            alt="${this.product ? this.product.name : ''}"
            class="product-details-modal__image"
          />
        </div>
        <div class="product-details-modal__info">
          <h2 class="product-details-modal__name">
            ${this.product ? this.product.name : ''}
          </h2>
          <h3 class="product-details-modal__price">
            ${this.product ? this.formatPrice(this.product.price) : ''}
          </h3>
          <div class="product-details-modal__description">
            ${this.product ? this.formatDescription(this.product.description) : ''}
          </div>
        </div>
      </div>
    `
  }

  public updateProduct(product: Product) {
    this.product = product;
    const modalBody = this.modal!.querySelector('.engrid-modal__body');
    if (modalBody) {
      modalBody.innerHTML = this.getModalContent();
    }
  }

  private formatDescription(description: string) {
    if (!description) return "";
    return description
      .split("\n\n")
      .map((line) => `<p>${line}</p>`)
      .join("");
  }

  private formatPrice(price: number) {
    if (!price || isNaN(price)) return "";
    return "$" + price.toFixed(2);
  }
}
