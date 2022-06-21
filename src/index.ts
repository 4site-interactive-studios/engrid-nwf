import { Options, App } from "@4site/engrid-common"; // Uses ENGrid via NPM
// import { Options, App } from "../../engrid-scripts/packages/common"; // Uses ENGrid via Visual Studio Workspace
import "./sass/main.scss";
import { customScript } from "./scripts/main";
import { FormSwitch } from "./scripts/form-switch/form-switch";
import { XVerify } from "./scripts/xverify/xverify";

const options: Options = {
  applePay: false,
  CapitalizeFields: true,
  ClickToExpand: true,
  DecimalSeparator: ".",
  // AutoYear: true,
  MediaAttribution: true,
  SkipToMainContentLink: true,
  SrcDefer: true,
  // ProgressBar: true,
  Debug: App.getUrlParameter("debug") == "true" ? true : false,
  RegionLongFormat: "supporter.NOT_TAGGED_132",
  TidyContact: {
    cid: 2,
    us_zip_divider: "-",
    record_field: "supporter.NOT_TAGGED_133",
    date_field: "supporter.NOT_TAGGED_134",
    status_field: "supporter.NOT_TAGGED_135",
    countries: ["us"],
    country_fallback: "us",
  },
  onLoad: () => {
    console.log("Starter Theme Loaded");
    customScript();
    if (window.hasOwnProperty("XVerifyOptions")) {
      (<any>window).XVerify = XVerify.getInstance((<any>window).XVerifyOptions);
    }
    (<any>window).validateXverify = XVerify.validateXverify;
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
new App(options);

(<any>window).FormSwitch = FormSwitch;
