import Encrypter from "./Encrypter";
import {
  ENGrid,
  EngridLogger,
  FastFormFill,
  RememberMeEvents,
  WelcomeBack,
} from "@4site/engrid-scripts";
import { CwhCartData } from "./cwh.types";
import * as Sentry from "@sentry/browser";

export default class CwhApp {
  private key: string = "u7+3LJpA3p7nFz5h9S1bVf1HQG/eLkV7+Xr5Ch3i2gU=";
  private logger: EngridLogger = new EngridLogger("CWH");
  private encrypter: Encrypter = new Encrypter(this.key);
  private cartData: CwhCartData = {} as CwhCartData;
  private urlParams: URLSearchParams = new URLSearchParams(
    window.location.search
  );

  constructor() {
    if (!this.shouldRun()) return;

    // If we're on the last page, just redirect to the success URL.
    if (this.onLastPage()) {
      Sentry.addBreadcrumb({
        message: "[CWH App] On Thank You Page - redirecting to success URL",
      });
      this.redirectToSuccessUrl();
      return;
    }

    Sentry.addBreadcrumb({
      message: "[CWH App] Loading Form Page",
    });

    let urlCartData = this.urlParams.get("cart");

    if (typeof urlCartData !== "string") {
      Sentry.addBreadcrumb({
        message: "[CWH App] Cart data not found in URL or invalid",
      });
      this.logger.log("Cart data not found in URL or invalid");
      document.querySelector(".cwh-back-button")?.remove();
      ENGrid.setBodyData("cwh-app-ready", "true");
      return;
    }

    this.logger.log("Encrypted cart data found in URL:", urlCartData);

    this.encrypter
      .decryptData(urlCartData as string)
      .then((data) => {
        this.cartData = data as CwhCartData;

        if (
          !this.cartData.successUrl ||
          !this.cartData.returnUrl ||
          !this.cartData.transactionId
        ) {
          Sentry.captureMessage(
            "[CWH App] Decrypted cart data missing required fields",
            {
              level: "warning",
              extra: {
                hasSuccessUrl: !!this.cartData.successUrl,
                hasReturnUrl: !!this.cartData.returnUrl,
                hasTransactionId: !!this.cartData.transactionId,
              },
            }
          );
          this.logger.log(
            "Decrypted cart data missing required fields:",
            this.cartData
          );
          document.querySelector(".cwh-back-button")?.remove();
          ENGrid.setBodyData("cwh-app-ready", "true");
          return;
        }

        sessionStorage.setItem("cwhSuccessUrl", this.cartData.successUrl);
        sessionStorage.setItem(
          "cwhTransactionId",
          this.cartData.transactionId.toString()
        );

        this.setupPage()
          .then(() => {
            ENGrid.setBodyData("cwh-app-ready", "true");
          })
          .catch((err) => {
            Sentry.captureException(err, {
              extra: { urlCartData },
            });
            this.logger.log("setupPage failed:", err);
            ENGrid.setBodyData("cwh-app-ready", "true");
          });
      })
      .catch((err) => {
        Sentry.captureException(err, {
          extra: { urlCartData },
        });
        this.logger.log("Failed to decrypt cart data:", err);
        document.querySelector(".cwh-back-button")?.remove();
        ENGrid.setBodyData("cwh-app-ready", "true");
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
    Sentry.addBreadcrumb({
      message: "[CWH App] Re-running WelcomeBack",
    });
    document.querySelector(".engrid-welcome-back")?.remove();
    document.querySelector(".engrid-personal-details-summary")?.remove();

    new FastFormFill();
    new WelcomeBack();
    RememberMeEvents.getInstance().dispatchLoad(true);

    document.querySelector(".engrid-welcome-back")?.classList.add("hide");
  }

  private addBackButton() {
    const backButton = document.querySelector(".cwh-back-button");
    if (!backButton) return;

    if (!this.cartData.returnUrl) {
      Sentry.captureMessage(
        "[CWH App] Back button skipped: missing returnUrl",
        {
          level: "warning",
        }
      );
      return;
    }

    if (backButton instanceof HTMLAnchorElement) {
      backButton.setAttribute("href", this.cartData.returnUrl);
    } else {
      Sentry.captureMessage(
        `[CWH App] Back button is unexpected element type: ${backButton.tagName}`,
        { level: "warning" }
      );
    }
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
      Sentry.captureMessage(
        "[CWH App] Redirect failed: missing session storage values",
        {
          level: "error",
          extra: {
            hasSuccessUrl: !!successUrlString,
            hasTransactionId: !!transactionId,
          },
        }
      );
      this.logger.log(
        "No success URL or transaction ID found in session storage"
      );
      return;
    }

    sessionStorage.removeItem("cwhSuccessUrl");
    sessionStorage.removeItem("cwhTransactionId");

    let successUrl: URL;
    try {
      successUrl = new URL(successUrlString);
    } catch (e) {
      Sentry.captureException(e, { extra: { successUrlString } });
      return;
    }

    const returnPayload = {
      transactionId: transactionId,
      enTransactionId: window.pageJson?.transactionId,
      supporterId: window.pageJson?.supporterId,
    };

    if (!window.pageJson?.transactionId) {
      Sentry.captureMessage(
        "[CWH App] pageJson.transactionId missing during redirect",
        { level: "warning", extra: { returnPayload } }
      );
    }
    if (!window.pageJson?.supporterId) {
      Sentry.captureMessage(
        "[CWH App] pageJson.supporterId missing during redirect",
        { level: "warning", extra: { returnPayload } }
      );
    }

    Sentry.addBreadcrumb({
      message: "Attempting encryptJson",
      data: { transactionId },
    });

    this.encrypter
      .encryptJson(returnPayload)
      .then((encryptedData) => {
        Sentry.addBreadcrumb({ message: "Encryption succeeded, redirecting" });
        successUrl.searchParams.set("payload", encryptedData);
        window.location.href = successUrl.href;
      })
      .catch((err) => {
        Sentry.captureException(err, {
          extra: { transactionId, successUrlString },
        });
      });
  }

  //Shipping Field - Fix for EN's functionality that sometimes fails.
  private fixShippingField() {
    const shippingField = ENGrid.getField(
      "transaction.shipenabled"
    ) as HTMLInputElement;
    if (shippingField) {
      Sentry.addBreadcrumb({
        message: "[CWH App] Applying shipping field fix",
        data: { checked: shippingField.checked },
      });
      this.toggleShippingAddressFields(shippingField.checked);
      shippingField.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        this.toggleShippingAddressFields(target.checked);
      });
    }
  }

  // Toggle the visibility of shipping address fields
  private toggleShippingAddressFields(enabled: boolean) {
    const enjs = window.EngagingNetworks?.require?._defined?.enjs;
    if (!enjs) {
      Sentry.captureMessage(
        "[CWH App] EngagingNetworks ENJS API unavailable - cannot toggle shipping fields",
        { level: "warning" }
      );
      return;
    }

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
        enjs.showField(fieldName);
      } else {
        enjs.hideField(fieldName);
      }
    });
  }
}
