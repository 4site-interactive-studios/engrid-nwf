import { Options, App, ENGrid } from "@4site/engrid-common"; // Uses ENGrid via NPM
// import { Options, App } from "../../engrid-scripts/packages/common"; // Uses ENGrid via Visual Studio Workspace
import "./sass/main.scss";
import "./scripts/main.js";
import { FormSwitch } from "./scripts/form-switch/form-switch";

const options: Options = {
  applePay: false,
  CapitalizeFields: true,
  ClickToExpand: true,
  CurrencySymbol: "$",
  DecimalSeparator: ".",
  // AutoYear: true,
  MediaAttribution: true,
  SkipToMainContentLink: true,
  SrcDefer: true,
  // ProgressBar: true,
  Debug: App.getUrlParameter("debug") == "true" ? true : false,
  onLoad: () => console.log("Starter Theme Loaded"),
  onResize: () => console.log("Starter Theme Window Resized"),
  onValidate: () => {
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
      }
    }
    return true;
  },
};
new App(options);

(<any>window).FormSwitch = FormSwitch;
