import { ENGrid, EngridLogger } from "@4site/engrid-scripts";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

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

  constructor() {
    if (!this.shouldRun()) {
      this.logger.log(
        "Shop is NOT running",
        this.rawProducts,
        this.rawProducts.length
      );

      return;
    }

    this.logger.log("Shop is running");

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
      });
    });

    this.logger.log("Products loaded", this.products);

    // Add price and "Learn more" link to each product element
    this.products.forEach((product) => {
      this.addProductDetails(product);
    });

    this.watchForProductMarkupChanges();
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
        ${
          product.description
            ? `<div class="engrid__pg__learnmore"><span>Learn more</span></div>`
            : ""
        }
      `;
    productName.insertAdjacentElement("afterend", productDetails);
  }

  shouldRun(): boolean {
    return ENGrid.getBodyData("subtheme") === "shop";
  }

  getProductElement(productId: number): HTMLElement | null {
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
}
