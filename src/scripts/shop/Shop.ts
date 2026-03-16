import { EnForm, ENGrid, EngridLogger } from "@4site/engrid-scripts";
import {
  RemoveProductVariants,
  Order,
  Product,
  ProductVariant,
  ShippingAddress,
  TransactionSessionData,
} from "./shop.types";
import ProductDetailsModal from "./ProductDetailsModal";
import Taxjar from "./Taxjar";

declare global {
  interface Window {
    EngagingNetworks: any;
    EngridShop: {
      discountCodes?: Record<string, number>;
      removeVariants?: RemoveProductVariants[];
    };
    pageJson: {
      transactionId: string;
      supporterId: number;
      amount: number;
      country: string;
    };
  }
}

export default class Shop {
  private logger: EngridLogger = new EngridLogger(
    "Shop",
    "black",
    "orange",
    "🛍️"
  );
  private _form: EnForm = EnForm.getInstance();
  private taxjar: Taxjar = new Taxjar();
  private rawProducts: any[] =
    window.EngagingNetworks?.premiumGifts?.products || [];
  private readonly products: Product[] = [];
  private readonly productDetailsModal: ProductDetailsModal | null = null;
  private productPrice: number = 0;
  private shippingPrice: number = 0;
  private tax: number = 0;
  private discount: number = 0;
  private discountValue: number = 0;
  private totalPrice: number = 0;
  private quantityOptionId: number = 90; // ID of the quantity option from Engaging Networks
  private shouldCollectTax =
    ENGrid.getPageNumber() === 1 &&
    !!document.querySelector('input[name="en_txn10"]'); // Only collect tax if we're on the first page and the tax field is present

  constructor() {
    if (!this.shouldRun()) {
      this.logger.log("Shop is NOT running");
      return;
    }
    if (ENGrid.getPageNumber() === 2) {
      this.createTaxjarTransaction();
      return;
    }
    this.logger.log("Shop is running");
    this.productDetailsModal = new ProductDetailsModal();
    this.setupProducts();
    this.addWatchersAndListeners();
    this.calculateTotalPrice().then(() => {
      this.updateCheckoutSummary();
    });
  }

  /*
   * Create our products array and adjust the DOM as needed
   */
  private setupProducts() {
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
          quantity: this.getVariantQuantity(variant.productVariantOptions),
        })),
      });
    });
    this.logger.log("Products loaded", this.products);
    // Add price and "Learn more" link to each product element
    this.products.forEach((product) => {
      this.addProductDetails(product);
    });

    this.hideProductVariants();
  }

  // Add event listeners and mutation observers
  private addWatchersAndListeners() {
    this.watchForProductMarkupChanges();
    this.watchForProductSelectionChanges();

    // Coupon code application
    document
      .querySelector(".button--apply-coupon")
      ?.addEventListener("click", async () => {
        let couponCodes = window.EngridShop.discountCodes || {};
        // Make all coupon codes uppercase for case-insensitive matching
        couponCodes = Object.fromEntries(
          Object.entries(couponCodes).map(([code, discount]) => [
            code.toUpperCase(),
            discount,
          ])
        );
        if (!Object.keys(couponCodes).length) return;

        const couponCode = ENGrid.getFieldValue("transaction.coupon")
          .toUpperCase()
          .trim();
        const couponField = document.querySelector(
          ".en__field--coupon"
        ) as HTMLInputElement;
        if (couponCode && couponCodes[couponCode]) {
          this.logger.log(
            `Applying coupon code: ${couponCode} for discount of ${couponCodes[couponCode]}%`
          );
          ENGrid.setBodyData("coupon-applied", "true");
          this.discount = couponCodes[couponCode];
          await this.calculateTotalPrice();
          this.updateCheckoutSummary();
          const couponCodeField = ENGrid.getField("transaction.coupon");
          couponCodeField?.setAttribute("disabled", "true");
          ENGrid.removeError(couponField);
          document
            .querySelector(".button--apply-coupon")
            ?.setAttribute("disabled", "true");
        } else {
          this.logger.log(`Invalid coupon code: ${couponCode}`);
          if (couponField) {
            ENGrid.setError(couponField, "Invalid coupon code");
          }
        }
      });

    // Amount validation
    this._form.onValidate.subscribe(() => {
      if (!this._form.validate) return;
      if (
        this.totalPrice.toFixed(2).toString() !==
        ENGrid.getFieldValue("transaction.donationAmt")
      ) {
        this.logger.log(
          `Total price mismatch: Expected value: ${this.totalPrice.toFixed(
            2
          )} vs Field value: ${ENGrid.getFieldValue("transaction.donationAmt")}`
        );
        this._form.validate = false;
        return false;
      }
    });

    // Create session storage entry on form submit to create TaxJar transaction on page 2
    this._form.onValidate.subscribe(() => {
      if (!this._form.validate) return;
      if (!this.shouldCollectTax) return; // Don't make TaxJar transaction when not collecting tax
      const address = this.getShippingAddress();
      const transactionSessionData: TransactionSessionData = {
        address: {
          ...address,
        },
        amountWithoutTax:
          this.productPrice + this.shippingPrice - this.discountValue,
        shipping: this.shippingPrice,
        tax: this.tax,
        discount: this.discountValue,
        product: this.getSelectedProduct(),
      };
      sessionStorage.setItem(
        "shopTransactionData",
        JSON.stringify(transactionSessionData)
      );
      this.logger.log(
        "Storing transaction data for TaxJar on page 2",
        transactionSessionData
      );
    });

    // calculate checkout total with tax on address change
    // Debounce address changes to avoid excessive tax calculations
    let addressChangeTimeout: number | undefined;
    const handleAddressChange = () => {
      if (addressChangeTimeout) {
        clearTimeout(addressChangeTimeout);
      }
      addressChangeTimeout = window.setTimeout(async () => {
        if (!this.shouldCollectTax) return;
        const address = this.getShippingAddress();
        if (
          !address.country ||
          !address.zip ||
          !address.state ||
          !address.city ||
          !address.street
        ) {
          this.logger.log(
            "Incomplete address, skipping tax calculation",
            address
          );
          return;
        }
        this.logger.log("Address changed, calculating tax", address);
        await this.calculateTotalPrice();
        this.updateCheckoutSummary();
      }, 500);
    };

    // Handle both input and change events for address fields via event delegation to accommodate dynamic fields
    const addressFields = [
      "supporter.country",
      "supporter.postcode",
      "supporter.region",
      "supporter.city",
      "supporter.address1",
      "transaction.shipcountry",
      "transaction.shippostcode",
      "transaction.shipregion",
      "transaction.shipcity",
      "transaction.shipadd1",
      "transaction.shipenabled",
    ];
    ["input", "change"].forEach((eventType) => {
      document
        .getElementById("engrid")
        ?.addEventListener(eventType, (event) => {
          const target = event.target as HTMLElement;
          if (
            target.matches(addressFields.map((f) => `[name="${f}"]`).join(","))
          ) {
            handleAddressChange();
          }
        });
    });

    //Shipping Field - Fix for EN's functionality that sometimes fails.
    const shippingField = ENGrid.getField(
      "transaction.shipenabled"
    ) as HTMLInputElement;
    if (shippingField) {
      this.toggleShippingAddressFields(shippingField.checked);
      shippingField.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        this.toggleShippingAddressFields(target.checked);
      });
    }
  }

  // Toggle the visibility of shipping address fields
  private toggleShippingAddressFields(enabled: boolean) {
    const fields = [
      "shipemail",
      "shiptitle",
      "shipfname",
      "shiplname",
      "shipadd1",
      "shipadd2",
      "shipcity",
      "shipregion",
      "shippostcode",
      "shipcountry",
      "shipnotes",
    ];
    this.logger.log(
      `Toggling shipping fields to ${enabled ? "enabled" : "disabled"}`
    );
    fields.forEach((fieldName) => {
      if (enabled) {
        window.EngagingNetworks.require._defined.enjs.showField(fieldName);
      } else {
        window.EngagingNetworks.require._defined.enjs.hideField(fieldName);
      }
    });
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

  // Get the "en__pg" element for a given product ID
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

  // Get the select input element for a variant of a given product
  private getProductVariantSelect(
    productName: string,
    variantName: string
  ): HTMLSelectElement | null {
    const productNameEls = [
      ...document.querySelectorAll(".en__pg__name"),
    ] as HTMLElement[];
    const productNameEl = productNameEls.find(
      (el) => el.innerText.trim().toLowerCase() === productName.toLowerCase()
    );
    if (!productNameEl) {
      this.logger.log(
        `Product element not found for product name: ${productName}`
      );
      return null;
    }
    const productDetailsEl = productNameEl.closest(".en__pg__detail");
    if (!productDetailsEl) {
      this.logger.log(
        `Product details element not found for product name: ${productName}`
      );
      return null;
    }
    const productOptionTypeLabels = [
      ...productDetailsEl.querySelectorAll(`.en__pg__optionType > label`),
    ] as HTMLElement[];
    const variantLabelEl = productOptionTypeLabels.find(
      (el) => el.innerText.trim().toLowerCase() === variantName.toLowerCase()
    );
    if (!variantLabelEl) {
      this.logger.log(
        `Variant label not found for variant name: ${variantName}`
      );
      return null;
    }
    const variantSelect =
      variantLabelEl.nextElementSibling as HTMLSelectElement;
    if (!variantSelect || variantSelect.tagName !== "SELECT") {
      this.logger.log(
        `Variant select not found for variant name: ${variantName}`
      );
      return null;
    }
    return variantSelect;
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
            (node.classList.contains("en__pg__body") ||
              node.classList.contains("en__pg__optionType"))
          ) {
            const productId = parseInt(
              (
                node
                  .closest(".en__pg")
                  ?.querySelector('input[name="en__pg"]') as HTMLInputElement
              )?.value
            );
            if (!productId) return;
            const product = this.products.find((p) => p.id === productId);
            if (
              product &&
              !node.closest(".en__pg")?.querySelector(".engrid__pg__details")
            ) {
              this.addProductDetails(product);
            }
          }
        });
      });
    });

    observer.observe(productList, { childList: true, subtree: true });
  }

  private async calculateTotalPrice(): Promise<number> {
    ENGrid.removeError(".en__submit");
    ENGrid.disableSubmit("Calculating total...");
    this.productPrice = this.getSelectedProductPrice();
    this.shippingPrice = this.getSelectedShippingPrice();
    this.discountValue = this.getDiscountValue();
    const calculatedTax = this.shouldCollectTax
      ? await this.getCalculatedTax()
      : 0;
    this.tax = calculatedTax === false ? 0 : calculatedTax;
    this.totalPrice =
      this.productPrice + this.shippingPrice + this.tax - this.discountValue;
    this.setPaymentValuesOnForm(this.totalPrice, this.tax);
    // If tax calculation failed and required, keep disabled submit button
    if (calculatedTax === false && this.shouldCollectTax) {
      this.logger.log("Tax calculation failed, keeping submit disabled");
      ENGrid.enableSubmit();
      document
        .querySelector(".en__submit button")
        ?.setAttribute("disabled", "true");
      ENGrid.setError(
        ".en__submit",
        "Unable to calculate tax. Please check your address."
      );
      return this.totalPrice;
    }
    ENGrid.enableSubmit();
    return this.totalPrice;
  }

  // Get the currently selected product variant from the ID on the page
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

  private async getCalculatedTax(): Promise<number | false> {
    const address = this.getShippingAddress();

    if (
      !address.country ||
      !address.zip ||
      !address.state ||
      !address.city ||
      !address.street
    ) {
      this.logger.log(
        "Incomplete shipping address, skipping tax calculation",
        address
      );
      return 0;
    }

    const order: Order = {
      to_zip: address.zip,
      to_state: address.state,
      to_city: address.city,
      to_street: address.street,
      to_country: address.country,
      shipping: this.shippingPrice,
      line_items: [
        {
          id: this.getSelectedProduct()?.id.toString() || "1",
          quantity: 1,
          unit_price: this.productPrice,
          discount: this.discountValue,
        },
      ],
    };

    try {
      const tax = await this.taxjar.calculateTax(order);
      this.logger.log(`Calculated tax to collect: ${tax}`);
      return tax;
    } catch (error) {
      this.logger.error("Error calculating tax", error);
      return false;
    }
  }

  private getDiscountValue(): number {
    if (!this.productPrice || !this.discount) return 0;
    return (this.productPrice * this.discount) / 100;
  }

  private getShippingAddress(): ShippingAddress {
    const shipToDifferentAddressField = ENGrid.getField(
      "transaction.shipenabled"
    ) as HTMLInputElement;

    if (shipToDifferentAddressField && shipToDifferentAddressField.checked) {
      return {
        country: ENGrid.getFieldValue("transaction.shipcountry"),
        zip: ENGrid.getFieldValue("transaction.shippostcode"),
        state: ENGrid.getFieldValue("transaction.shipregion"),
        city: ENGrid.getFieldValue("transaction.shipcity"),
        street: ENGrid.getFieldValue("transaction.shipadd1"),
      };
    }

    return {
      country: ENGrid.getFieldValue("supporter.country"),
      zip: ENGrid.getFieldValue("supporter.postcode"),
      state: ENGrid.getFieldValue("supporter.region"),
      city: ENGrid.getFieldValue("supporter.city"),
      street: ENGrid.getFieldValue("supporter.address1"),
    };
  }

  // Update our checkout summary when the selected product changes
  private watchForProductSelectionChanges() {
    const productVariantInput = document.querySelector(
      'input[name="transaction.selprodvariantid"]'
    ) as HTMLInputElement;
    if (!productVariantInput) {
      this.logger.log("Product variant input not found");
      return;
    }
    const observer = new MutationObserver(() => {
      this.calculateTotalPrice().then(() => {
        this.updateCheckoutSummary();
      });
    });
    observer.observe(productVariantInput, {
      attributes: true,
      attributeFilter: ["value"],
    });
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
      productQuantityElement.innerText = `Quantity: ${selectedProduct.quantity}`;
    }

    const productImageElement = document.querySelector(
      ".engrid__checkout-item__image img"
    ) as HTMLImageElement;
    if (productImageElement) {
      productImageElement.src = selectedProduct.image;
      productImageElement.alt = selectedProduct.name;
    }

    const productPriceElement = document.querySelector(
      ".engrid__checkout-item--product .engrid__checkout-item__cost span"
    ) as HTMLElement;
    if (productPriceElement) {
      productPriceElement.innerText = `$${this.productPrice.toFixed(2)}`;
    }

    const shippingPriceElement = document.querySelector(
      ".engrid__checkout-item--shipping .engrid__checkout-item__cost span"
    ) as HTMLElement;
    if (shippingPriceElement) {
      shippingPriceElement.innerText = `$${this.shippingPrice.toFixed(2)}`;
    }

    const discountAmountElement = document.querySelector(
      ".engrid__checkout-item--discount .engrid__checkout-item__cost span"
    ) as HTMLElement;
    if (discountAmountElement) {
      discountAmountElement.innerText = `-$${this.discountValue.toFixed(2)}`;
    }

    const taxAmountElement = document.querySelector(
      ".engrid__checkout-item--tax .engrid__checkout-item__cost span"
    ) as HTMLElement;
    if (taxAmountElement) {
      if (this.shouldCollectTax) {
        taxAmountElement.innerText = `$${this.tax.toFixed(2)}`;
      } else {
        document
          .querySelector(".engrid__checkout-item--tax")
          ?.classList.add("hide");
      }
    }

    const totalPriceElement = document.querySelector(
      ".engrid__checkout-item--total .engrid__checkout-item__cost span"
    ) as HTMLElement;
    if (totalPriceElement) {
      totalPriceElement.innerText = `$${this.totalPrice.toFixed(2)}`;
    }
  }

  private setPaymentValuesOnForm(totalPrice: number, taxAmount: number) {
    ENGrid.setFieldValue(
      "transaction.donationAmt",
      totalPrice.toFixed(2).toString(),
      true,
      true
    );
    this.logger.log(`Payment amount set to $${totalPrice.toFixed(2)}`);
    if (this.shouldCollectTax) {
      ENGrid.setFieldValue(
        "en_txn10",
        taxAmount.toFixed(2).toString(),
        true,
        true
      );
      this.logger.log(`Tax amount set to $${taxAmount.toFixed(2)}`);
    }
  }

  private getVariantQuantity(productVariantOptions: any) {
    // Get the product variant options on the page. If none exist, return 1.
    const premiumOptions: {
      id: number;
      optionTypeId: number;
      name: string;
      clientId: string;
      createdOn: number;
    }[] = window.EngagingNetworks?.premiumGifts?.options || [];
    if (!premiumOptions.length) return 1;

    // Filter the product variant options to find the quantity option. If none exist, return 1.
    const quantityOptions = premiumOptions.filter(
      (option: any) => option.optionTypeId === this.quantityOptionId
    );
    if (!quantityOptions.length) return 1;

    // Find the product variant option that matches the quantity option. If none exist, return 1.
    const quantity = quantityOptions.find((option: any) =>
      productVariantOptions.some(
        (vOption: any) => vOption.optionId === option.id
      )
    );

    return quantity ? parseInt(quantity.name) || 1 : 1;
  }

  private createTaxjarTransaction() {
    const rawTransactionsSessionData = sessionStorage.getItem(
      "shopTransactionData"
    );
    if (!rawTransactionsSessionData) {
      this.logger.log("No transaction data found in session storage");
      return;
    }

    let transactionSessionData: TransactionSessionData;
    try {
      transactionSessionData = JSON.parse(rawTransactionsSessionData || "{}");
    } catch (e) {
      this.logger.log(
        "Could not parse transaction data from session storage",
        e
      );
      return;
    }

    if (
      !transactionSessionData ||
      !transactionSessionData.address ||
      !transactionSessionData.product
    ) {
      this.logger.log("No transaction data found in session storage");
      return;
    }

    try {
      const transaction = {
        transaction_id: window.pageJson.transactionId,
        transaction_date: new Date().toISOString().split("T")[0],
        supporter_id: window.pageJson.supporterId,
        to_country: transactionSessionData.address.country,
        to_zip: transactionSessionData.address.zip,
        to_state: transactionSessionData.address.state,
        to_city: transactionSessionData.address.city,
        to_street: transactionSessionData.address.street,
        amount: transactionSessionData.amountWithoutTax,
        shipping: transactionSessionData.shipping,
        sales_tax: transactionSessionData.tax,
        line_items: [
          {
            quantity: 1,
            product_identifier: transactionSessionData.product.id.toString(),
            description: transactionSessionData.product.name,
            unit_price: transactionSessionData.product.price,
            discount: transactionSessionData.discount || 0,
            sales_tax: transactionSessionData.tax,
          },
        ],
      };
      this.logger.log("Creating TaxJar transaction", transaction);
      this.taxjar.createEnTransaction(transaction).then((r) => {});
    } catch (e) {
      this.logger.error("Error creating TaxJar transaction", e);
    }

    sessionStorage.removeItem("shopTransactionData");
  }

  // Inject CSS to hide unwanted product variants, and adjust selected options if needed
  private hideProductVariants() {
    if (!window.EngridShop.removeVariants?.length) return;

    this.logger.log(
      "Hiding product variants",
      window.EngridShop.removeVariants
    );

    // Remove previous style tag if present
    const existing = document.getElementById("engrid-variant-hide-style");
    if (existing) existing.remove();

    let css = ``;
    window.EngridShop.removeVariants.forEach((remove) => {
      const selectElement = this.getProductVariantSelect(
        remove.product,
        remove.variantName
      );
      if (!selectElement) return;
      const wrapperElement = selectElement.closest(".en__pg");
      if (!wrapperElement) return;

      const hiddenValuesForThisSelect = new Set<string>();
      //get wrapper element nth position of its parent
      const wrapperIndex = [...wrapperElement.parentElement!.children].indexOf(
        wrapperElement
      );
      // Build CSS to hide the unwanted options
      remove.variantOptions.forEach((optionValue) => {
        const option = [...selectElement.options].find(
          (opt) => opt.text.trim().toLowerCase() === optionValue.toLowerCase()
        );
        if (!option) return;
        hiddenValuesForThisSelect.add(option.value);
        css += `
            /* In product "${remove.product}" hide variant "${optionValue}" */
            .en__pg:nth-child(${wrapperIndex + 1}) select option[value="${
          option.value
        }"] {
              display: none;
            }
          `;
      });

      // If our selected value is one we are hiding, change it to the first non-hidden option
      const selectedValue = selectElement.value;
      if (hiddenValuesForThisSelect.has(selectedValue)) {
        // Find the first non-hidden option to select
        const firstVisibleOption = [...selectElement.options].find(
          (opt) => !hiddenValuesForThisSelect.has(opt.value)
        );
        if (firstVisibleOption) {
          selectElement.value = firstVisibleOption.value;
          selectElement.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });

    const style = document.createElement("style");
    style.id = "engrid-variant-hide-style";
    style.textContent = css;
    document.head.appendChild(style);
  }
}
