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
    certFee: 5,
    productCost: 20,
    donation: 7,
    tax: 3,
  };
  private testEncryptedPayload: string =
    "pHF6vIM9LQcu4pkGNirZFRaI4fk7189ZxGdF5_NLat40z9IApDoYd2Da_bGZbksZwHxJEtDDRG4M-NmDjtaK7xX65d76l1VOukpq-X0E9GYbRuD08OP6oFMgG-dCuTRPdCa_5TR5QE28SjFQIumcaopj5WsRLylZLmU7Yz9kKfPf0-nprLEsIsnivlf-_7vjrTQHNwtumaI8bthrJpZ8_BBrlsybxkXF--lQPG9jrPVAblvPowcdT6GukcCcM6sq5wGXDwEBDoA1ASk1A1tucnDm3W2fq03O7gsc3LRNQWWW30OfkIsA3lEuPhA7ubbR18uzU0ibKsrznZBej2xl8BnfTKo6BSyjSx2MXtSTSRn3BqiUYYGMVX_QzRuSY-nT3FKxWUTw-OWdA4eypRVBRBFnrkShyNESy-zx_QWM0he13wfwQ2LksrxTYg4QRlpaI3jbKBb18QDjdz2A6YOd98xCEr59cMQhWv3d9nezm1nPfd1EENExwrbBrUKDO7l-ccIeKfzad7LJCtJvkXMmf7g";

  constructor() {
    if (!this.shouldRun()) return;

    // this.encrypter.encryptJson(this.testPayload).then((encrypted) => {
    //   this.logger.log("Test encrypted payload:", encrypted);
    // });

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
      en_txn7: "productCost",
      en_txn8: "donation",
      en_txn9: "certFee",
      en_txn10: "tax",
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
    successUrl.searchParams.set("transactionId", transactionId);
    successUrl.searchParams.set(
      "enTransactionId",
      window.pageJson?.transactionId?.toString()
    );
    successUrl.searchParams.set(
      "supporterId",
      window.pageJson?.supporterId?.toString()
    );
    this.logger.log("Redirecting to success URL:", successUrl.toString());
    window.location.href = successUrl.href;
  }
}
