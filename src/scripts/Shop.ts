import { ENGrid, EngridLogger } from "@4site/engrid-scripts";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
}

export default class Shop {
  private logger: EngridLogger = new EngridLogger("Shop", "black", "orange", "🛍️");
  private rawProducts: any[] = window.EngagingNetworks?.premiumGifts?.products || [];
  private readonly products: Product[] = [];

  constructor() {
    if (!this.shouldRun()) {
      this.logger.log("Shop is NOT running", this.rawProducts, this.rawProducts.length);

      return;
    }
    this.logger.log("Shop is running");

    this.rawProducts.forEach((product) => {
      const defaultProductVariant = product.variants.find((variant: any) => variant.productVariantOptions.length === 0);
      if (!defaultProductVariant) {
        this.logger.log(`No default variant found for product ${product.id}`);
        return;
      }
      this.products.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: defaultProductVariant.price
      });
    });

    this.logger.log("Products loaded", this.products);

    this.products.forEach((product) => {
      this.logger.log(`Product ID: ${product.id}, Name: ${product.name}, Price: ${product.price}`);
      const productElement = this.getProductElement(product.id);
      if (!productElement) {
        this.logger.log(`Product element not found for product ID: ${product.id}`);
        return;
      }
      const productName = productElement.querySelector(".en__pg__name") as HTMLElement;
      const productDetails = document.createElement("div");
      productDetails.className = "engrid__pg__details";
      productDetails.innerHTML = `
        <div class="engrid__pg__price">$${product.price.toFixed(2)}</div>
        ${product.description ? `<div class="engrid__pg__learnmore">Learn more</div>` : ""}
      `;
      productName.insertAdjacentElement("afterend", productDetails);
    });

  }

  shouldRun(): boolean {
   return ENGrid.getBodyData("subtheme") === "shop";
  }

  getProductElement(productId: number): HTMLElement | null {
    const productRadio = document.querySelector(`input[name="en__pg"][value="${productId}"]`) as HTMLInputElement;
    if (!productRadio) {
      this.logger.log(`Product radio input not found for product ID: ${productId}`);
      return null;
    }
    return productRadio.closest(".en__pg") as HTMLElement;
  }
}
