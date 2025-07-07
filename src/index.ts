import { Options, App, DonationFrequency, EnForm } from "@4site/engrid-scripts"; // Uses ENGrid via NPM
// import {
//   Options,
//   App,
//   DonationFrequency,
//   EnForm,
// } from "../../engrid/packages/scripts"; // Uses ENGrid via Visual Studio Workspace
import "./sass/main.scss";
import { customScript } from "./scripts/main";
import { FormSwitch } from "./scripts/form-switch/form-switch";
import { XVerify } from "./scripts/xverify/xverify";
// import { AnnualLimit } from "./scripts/annual-limit";

const options: Options = {
  applePay: false,
  CapitalizeFields: true,
  ClickToExpand: true,
  DecimalSeparator: ".",
  AutoYear: true,
  MediaAttribution: true,
  SkipToMainContentLink: true,
  SrcDefer: true,
  // ProgressBar: true,
  Debug: App.getUrlParameter("debug") == "true" ? true : false,
  RegionLongFormat: "supporter.NOT_TAGGED_132",
  TidyContact: {
    cid: "bef8ae72-076f-4188-9e29-45432964af49",
    us_zip_divider: "",
    record_field: "supporter.NOT_TAGGED_133",
    date_field: "supporter.NOT_TAGGED_134",
    status_field: "supporter.NOT_TAGGED_135",
    countries: ["us"],
    country_fallback: "us",
    phone_enable: true,
    phone_preferred_countries: ["us", "ca", "gb"],
    phone_record_field: "supporter.NOT_TAGGED_138",
    phone_date_field: "supporter.NOT_TAGGED_139",
    phone_status_field: "supporter.NOT_TAGGED_140",
  },
  onLoad: () => {
    console.log("Starter Theme Loaded");
    customScript(DonationFrequency, App);
    if (window.hasOwnProperty("XVerifyOptions")) {
      (<any>window).XVerify = XVerify.getInstance((<any>window).XVerifyOptions);
    }
    (<any>window).validateXverify = XVerify.validateXverify;
    // new AnnualLimit();
  },
  onValidate: () => {
    const paymentType = App.getPaymentType();
    const phoneContainer = document.querySelector(
      ".en__field--phoneNumber"
    ) as HTMLElement;
    const form = EnForm.getInstance();
    form.validate = true;
    if (phoneContainer && paymentType === "ACH") {
      // Check if phone number is empty
      const phoneInput = phoneContainer.querySelector("input");
      if (phoneInput && !phoneInput.value) {
        App.setError(
          phoneContainer,
          "Phone Number is required for the Bank Account payment method"
        );
        form.validate = false;
      } else {
        App.removeError(phoneContainer);
      }
    }

    // Optional email field on specific pages
    if ([64320, 82994, 82995].includes(App.getPageID())) {
      if (App.getFieldValue("supporter.emailAddress") === "") {
        const email = `${App.getFieldValue(
          "supporter.firstName"
        )}${App.getFieldValue(
          "supporter.lastName"
        )}${Date.now()}-autofilled@noaddress.ea`;
        App.setFieldValue("supporter.emailAddress", email);
      }
    }
  },
  onResize: () => console.log("Starter Theme Window Resized"),
  onSubmit: () => {
    const premiumGift = <HTMLInputElement>(
      document.querySelector('[name="en__pg"]:checked')
    );
    let excludePremiumGift: boolean | HTMLInputElement = false;
    if (premiumGift) {
      excludePremiumGift =
        premiumGift.value === "0"
          ? <HTMLInputElement>(
              document.querySelector(
                '[name="supporter.questions.100077"][value="Y"]'
              )
            )
          : <HTMLInputElement>(
              document.querySelector(
                '[name="supporter.questions.100077"][value="N"]'
              )
            );
      if (excludePremiumGift) {
        excludePremiumGift.checked = true;
        console.log("Excluding Premium Gift", excludePremiumGift);
      }
    }
    return true;
  },
};

if (document.body.dataset.engridTheme === "nwf2") {
  options.RememberMe = {
    checked: true,
    remoteUrl: "https://rememberme.nwf.org/index.html",
    fieldOptInSelectorTarget:
      "div.en__field--phoneNumber2, div.en__field--phoneNumber, div.en__field--email",
    fieldOptInSelectorTargetLocation: "after",
    fieldClearSelectorTarget: "div.en__field--email div",
    fieldClearSelectorTargetLocation: "after",
    fieldNames: [
      "supporter.firstName",
      "supporter.lastName",
      "supporter.address1",
      "supporter.address2",
      "supporter.city",
      "supporter.country",
      "supporter.region",
      "supporter.postcode",
      "supporter.emailAddress",
    ],
  };
}

new App(options);

(<any>window).FormSwitch = FormSwitch;
