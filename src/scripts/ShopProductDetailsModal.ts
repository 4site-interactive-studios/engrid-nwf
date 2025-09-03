import { Modal } from "@4site/engrid-scripts";

export default class ShopProductDetailsModal extends Modal {
  constructor() {
    super({
      onClickOutside: "close",
      addCloseButton: false,
      closeButtonLabel: "Close",
      customClass: "shop-product-details-modal",
      showCloseX: true,
    });
  }

  getModalContent(): NodeListOf<Element> {
    return document.querySelectorAll(
      ".shop-product-details-modal-content"
    ) as NodeListOf<Element>;
  }
}
