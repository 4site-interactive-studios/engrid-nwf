import Encrypter from "./Encrypter";
import {
  ENGrid,
  EngridLogger,
  FastFormFill,
  RememberMeEvents,
  WelcomeBack,
} from "@4site/engrid-scripts";
import { CwhCartData } from "./cwh.types";

export default class CwhApp {
  private key: string = "u7+3LJpA3p7nFz5h9S1bVf1HQG/eLkV7+Xr5Ch3i2gU=";
  private logger: EngridLogger = new EngridLogger("CWH");
  private encrypter: Encrypter = new Encrypter(this.key);
  private cartData: CwhCartData = {} as CwhCartData;
  private urlParams: URLSearchParams = new URLSearchParams(
    window.location.search
  );
  private testPayload = {
    email: "michaelt@4sitestudios.com",
    firstName: "Michael",
    lastName: "Thomas",
    address1: "3431 14th St NW Ste 1",
    address2: "Suite 1",
    city: "Washington",
    region: "DC",
    zip: "20010",
    country: "US",
    totalAmount: 35,
    returnUrl: "https://cwh.nwf.org/checkout",
    successUrl: "https://cwh.nwf.org/success",
    transactionId: 12345,
    externalRef: "30.00,WH25MSK,70.00,SI26VC2",
  };
  private testEncryptedPayload: string =
    "R90vSDfbNDVzytuRvzbcHmzhdfFqO3HLfyOCYrNemAdytYLN52zhXuKDWaCM0lO1zJCLNH2LXDX6B-0idrPd74lu4rEFSp_RjrDVPPcKYxEJrGFCMfEx518d8zJhObWz83iL-_wa0Hf09fjoTw_zskdwORgrnVk9kW_MQuuhmi0lyz5DOq7fY2c20TdRdi75uM1t3LxRzptoB2Ffc4kwihykX4r2ZO3jkfYJcjK98nuIgv3RDrOitQ2R7Z5RDfElwI5f7DMZQJVEaCYkg28DYDfKECZrDSkRty5yCvX0bob0BBDP2bwc0f5s1AN3DLHVB3mMsr5nP1IRtsA19VF7jnUUq729Y-gkfiKZKZ5Hg5wl50kMDlHRdOgCJ6fFPJJh3onFndRT2rpe2ksPz4-1sfIKte5Wg9AILhcJeE-N8VrBLx8JsHOKDu1UjiCAPrkXH2eo6kA7nMxHf0Pd2kJgnbpH5nSii-cpj_vmxH-4aFtKFpYDKHM3v1aVYFgjLqDC9zjHOz50fS2oX_8";

  constructor() {
    if (!this.shouldRun()) return;

    this.encrypter.encryptJson(this.testPayload).then((encrypted) => {
      this.logger.log("Test encrypted payload:", encrypted);
    });

    // If we're on the last page, just redirect to the success URL.
    if (this.onLastPage()) {
      this.redirectToSuccessUrl();
      return;
    }

    let urlCartData = this.urlParams.get("cart");

    if (this.urlParams.get("test") === "true") {
      this.logger.warn("Test mode enabled - using hardcoded encrypted payload");
      urlCartData = this.testEncryptedPayload;
    }

    if (typeof urlCartData !== "string") {
      this.logger.log("Cart data not found in URL or invalid");
      document.querySelector(".cwh-back-button")?.remove();
      ENGrid.setBodyData("cwh-app-ready", "true");
      return;
    }

    this.logger.log("Encrypted cart data found in URL:", urlCartData);

    this.encrypter.decryptData(urlCartData as string).then((data) => {
      this.cartData = data as CwhCartData;
      sessionStorage.setItem("cwhSuccessUrl", this.cartData.successUrl);
      sessionStorage.setItem(
        "cwhTransactionId",
        this.cartData.transactionId.toString()
      );
      this.setupPage().then(() => {
        ENGrid.setBodyData("cwh-app-ready", "true");
      });
    });
  }

  shouldRun(): boolean {
    return !!document.querySelector(".cwh-app");
  }

  private async setupPage() {
    if (!this.cartData) return;
    this.logger.log("Decrypted cart data:", this.cartData);
    await this.setFormFieldValues();
    this.rerunWelcomeBack();
    this.addBackButton();
    this.fixShippingField();
    this.handleFormErrors();
  }

  private async setFormFieldValues() {
    const fieldsMapping: { [key: string]: keyof CwhCartData } = {
      "supporter.emailAddress": "email",
      "supporter.firstName": "firstName",
      "supporter.lastName": "lastName",
      "supporter.address1": "address1",
      "supporter.address2": "address2",
      "supporter.city": "city",
      "supporter.region": "region",
      "supporter.postcode": "zip",
      "supporter.country": "country",
      "transaction.donationAmt": "totalAmount",
      en_txn8: "externalRef",
    };

    // Delay to account for scripts that overwrite country/state fields on load.
    await this.delay(1000);

    for (const [selector, dataKey] of Object.entries(fieldsMapping)) {
      ENGrid.setFieldValue(selector, this.cartData[dataKey] || "", true, true);
    }

    this.logger.log("Form field values set");
  }

  // Since WelcomeBack runs on initial page load but this script is running later
  // remove its components and run everything again.
  private rerunWelcomeBack() {
    document.querySelector(".engrid-welcome-back")?.remove();
    document.querySelector(".engrid-personal-details-summary")?.remove();

    new FastFormFill();
    new WelcomeBack();
    RememberMeEvents.getInstance().dispatchLoad(true);

    document.querySelector(".engrid-welcome-back")?.classList.add("hide");
  }

  private addBackButton() {
    const backButton = document.querySelector(
      ".cwh-back-button"
    ) as HTMLButtonElement;
    if (!backButton) return;
    backButton.setAttribute("href", this.cartData.returnUrl);
  }

  private async delay(number: number) {
    return new Promise((resolve) => setTimeout(resolve, number));
  }

  private onLastPage() {
    return ENGrid.getPageNumber() === ENGrid.getPageCount();
  }

  private redirectToSuccessUrl() {
    let successUrlString = sessionStorage.getItem("cwhSuccessUrl");
    let transactionId = sessionStorage.getItem("cwhTransactionId");
    if (!successUrlString || !transactionId) {
      this.logger.log(
        "No success URL or transaction ID found in session storage"
      );
      return;
    }

    sessionStorage.removeItem("cwhSuccessUrl");
    sessionStorage.removeItem("cwhTransactionId");

    const successUrl = new URL(successUrlString);

    const returnPayload = {
      transactionId: transactionId,
      enTransactionId: window.pageJson?.transactionId,
      supporterId: window.pageJson?.supporterId,
    };

    this.encrypter.encryptJson(returnPayload).then((encryptedData) => {
      successUrl.searchParams.set("payload", encryptedData);
      window.location.href = successUrl.href;
    });
  }

  //Shipping Field - Fix for EN's functionality that sometimes fails.
  private fixShippingField() {
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

  private handleFormErrors() {}
}
