import { ENGrid, EngridLogger } from "@4site/engrid-scripts";
import { Product, ProductVariant } from "./product.interface";
import ProductDetailsModal from "./ProductDetailsModal";

export default class Shop {
  private logger: EngridLogger = new EngridLogger(
    "Shop",
    "black",
    "orange",
    "🛍️"
  );
  private rawProducts: any[] =
    window.EngagingNetworks?.premiumGifts?.products || [];
  private readonly products: Product[] = [];
  private readonly productDetailsModal: ProductDetailsModal | null = null;
  private productPrice: number = 0;
  private shippingPrice: number = 0;
  private tax: number = 0;
  private discount: number = 0;
  private totalPrice: number = 0;

  constructor() {
    if (!this.shouldRun()) {
      this.logger.log("Shop is NOT running");
      return;
    }
    this.logger.log("Shop is running");
    this.productDetailsModal = new ProductDetailsModal();
    // Create a simplified products array with only the necessary details
    this.rawProducts.forEach((product) => {
      const defaultProductVariant = product.variants.find(
        (variant: any) => variant.productVariantOptions.length === 0
      );
      if (!defaultProductVariant) {
        this.logger.log(`No default variant found for product ${product.id}`);
        return;
      }
      this.products.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: defaultProductVariant.price,
        image: product.images[0]?.url || "",
        variants: product.variants.map((variant: any) => ({
          id: variant.id,
          productId: variant.productId,
          price: variant.price,
          image: product.images[0]?.url || "",
          name: product.name,
        }))
      });
    });
    this.logger.log("Products loaded", this.products);
    // Add price and "Learn more" link to each product element
    this.products.forEach((product) => {
      this.addProductDetails(product);
    });
    this.addWatchersAndListeners();
    this.calculateTotalPrice();
    this.updateCheckoutSummary();
  }

  private addWatchersAndListeners() {
    this.watchForProductMarkupChanges();
    this.watchForProductSelectionChanges();
  }

  // Add price and "Learn more" link below product name
  private addProductDetails(product: Product) {
    const productElement = this.getProductElement(product.id);
    if (!productElement) {
      this.logger.log(
        `Product element not found for product ID: ${product.id}`
      );
      return;
    }
    const productName = productElement.querySelector(
      ".en__pg__name"
    ) as HTMLElement;
    const productDetails = document.createElement("div");
    productDetails.className = "engrid__pg__details";
    productDetails.innerHTML = `
        <div class="engrid__pg__price">$${product.price.toFixed(2)}</div>
        <div class="engrid__pg__learnmore"><span>Learn more</span></div>
    `;
    productName.insertAdjacentElement("afterend", productDetails);
    const learnMoreLink = productDetails.querySelector(
      ".engrid__pg__learnmore span"
    ) as HTMLElement;
    learnMoreLink.addEventListener("click", () => {
      if (this.productDetailsModal) {
        this.productDetailsModal.updateProduct(product);
        this.productDetailsModal.open();
      }
    });
  }

  private shouldRun(): boolean {
    return ENGrid.getBodyData("subtheme") === "shop";
  }

  private getProductElement(productId: number): HTMLElement | null {
    const productRadio = document.querySelector(
      `input[name="en__pg"][value="${productId}"]`
    ) as HTMLInputElement;
    if (!productRadio) {
      this.logger.log(
        `Product radio input not found for product ID: ${productId}`
      );
      return null;
    }
    return productRadio.closest(".en__pg") as HTMLElement;
  }

  // When selecting a product variant, its markup is replaced.
  // We need to watch for these changes and re-add the price and "Learn more" link.
  private watchForProductMarkupChanges() {
    const productList = document.querySelector(".en__pgList");
    if (!productList) {
      this.logger.log("Product list element not found");
      return;
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.classList.contains("en__pg__body")
          ) {
            const productId = parseInt(
              (
                node.querySelector('input[name="en__pg"]') as HTMLInputElement
              )?.value
            );
            const product = this.products.find((p) => p.id === productId);
            if (product && !node.querySelector(".engrid__pg__details")) {
              this.addProductDetails(product);
            }
          }
        });
      });
    });
    observer.observe(productList, { childList: true, subtree: true } );
  }

  private calculateTotalPrice(): number {
    this.productPrice = this.getSelectedProductPrice();
    this.shippingPrice = this.getSelectedShippingPrice();
    this.tax = this.getCalculatedTax(this.productPrice)
    this.discount = this.getDiscountAmount(this.productPrice);
    this.totalPrice = (this.productPrice + this.shippingPrice + this.tax) - this.discount;
    //TODO: Update amount in a hidden input field to pass to Engaging Networks
    return this.totalPrice;
  }

  private getSelectedProduct(): ProductVariant | null {
    const selectedProductId = document.querySelector<HTMLInputElement>(
      'input[name="transaction.selprodvariantid"]'
    )?.value;
    if (!selectedProductId) {
      this.logger.log("No product selected");
      return null;
    }
    let productVariant: ProductVariant | undefined;
    this.products.forEach((p: Product) => {
      if (productVariant) return;
      productVariant = p.variants.find(
        (v) => v.id.toString() === selectedProductId
      );
    });
    if (!productVariant) {
      this.logger.log(`Selected product not found`, selectedProductId);
      return null;
    }
    this.logger.log(`Selected product`, productVariant);
    return productVariant;
  }

  private getSelectedProductPrice(): number {
    const productVariant = this.getSelectedProduct();
    if (!productVariant) {
      this.logger.log(`Could not get selected product price`);
      return 0;
    }
    return productVariant.price;
  }

  private getSelectedShippingPrice(): number {
    // Shipping price will be a future enhancement. For now, all shipping is free.
    return 0;
  }

  private getCalculatedTax(productPrice: number): number {
    const address = this.getShippingAddress();
    // return 5% of product price as tax for demo purposes
    // TODO: Implement TaxJar for tax calculation based on shipping address
    return productPrice * 0.05;
  }

  private getDiscountAmount(productPrice: number): number {
    return 0;
  }

  private getShippingAddress(): object {
    // should be the shipping address fields if user ticks the box to ship to a different address
    return {};
  }

  private watchForProductSelectionChanges() {
    const productVariantInput = document.querySelector(
      'input[name="transaction.selprodvariantid"]'
    ) as HTMLInputElement;
    if (!productVariantInput) {
      this.logger.log("Product variant input not found");
      return;
    }
    const observer = new MutationObserver(() => {
      this.calculateTotalPrice();
      this.updateCheckoutSummary();
    });
    observer.observe(productVariantInput, { attributes: true, attributeFilter: ['value'] });
  }

  private updateCheckoutSummary() {
    const selectedProduct = this.getSelectedProduct();
    if (!selectedProduct) {
      this.logger.log("No selected product to update checkout summary");
      return;
    }

    const productNameElement = document.querySelector(
      ".engrid__checkout-item--product .engrid__checkout-item__title span"
    ) as HTMLElement;
    if (productNameElement) {
      productNameElement.innerText = selectedProduct.name;
    }

    const productQuantityElement = document.querySelector(
      ".engrid__checkout-item__quantity span"
    ) as HTMLElement;
    if (productQuantityElement) {
      //TODO: Implement quantity selection in the future
      productQuantityElement.innerText = "Quantity: 1";
    }

    const productImageElement = document.querySelector(".engrid__checkout-item__image img") as HTMLImageElement;
    if (productImageElement) {
      productImageElement.src = selectedProduct.image;
      productImageElement.alt = selectedProduct.name;
    }

    const productPriceElement = document.querySelector(".engrid__checkout-item--product .engrid__checkout-item__cost span") as HTMLElement;
    if (productPriceElement) {
      productPriceElement.innerText = `$${this.productPrice.toFixed(2)}`;
    }

    const shippingPriceElement = document.querySelector(".engrid__checkout-item--shipping .engrid__checkout-item__cost span") as HTMLElement;
    if (shippingPriceElement) {
      shippingPriceElement.innerText = `$${this.shippingPrice.toFixed(2)}`;
    }

    const discountAmountElement = document.querySelector(".engrid__checkout-item--discount .engrid__checkout-item__cost span") as HTMLElement;
    if (discountAmountElement) {
      discountAmountElement.innerText = `-$${this.discount.toFixed(2)}`;
    }

    const taxAmountElement = document.querySelector(".engrid__checkout-item--tax .engrid__checkout-item__cost span") as HTMLElement;
    if (taxAmountElement) {
      taxAmountElement.innerText = `$${this.tax.toFixed(2)}`;
    }

    const totalPriceElement = document.querySelector(".engrid__checkout-item--total .engrid__checkout-item__cost span") as HTMLElement;
    if (totalPriceElement) {
      totalPriceElement.innerText = `$${this.totalPrice.toFixed(2)}`;
    }
  }
}
