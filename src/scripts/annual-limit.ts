// This script hides the premium gift options for the annual frequency until the amount is
// greater than the minimum amount for the one-time frequency.
import {
  DonationAmount,
  DonationFrequency,
  ENGrid,
  EngridLogger,
} from "@4site/engrid-scripts";

export class AnnualLimit {
  private logger: EngridLogger = new EngridLogger(
    "AnnualLimit",
    "yellow",
    "darkblue",
    "📅"
  );
  public _amount: DonationAmount = DonationAmount.getInstance();
  private _frequency: DonationFrequency = DonationFrequency.getInstance();
  private annualLimit = 0;
  private country = ENGrid.getField("supporter.country") as HTMLInputElement;
  constructor() {
    if (!this.shouldRun()) return;
    this.loadAnnualLimit();
    this._frequency.onFrequencyChange.subscribe(() => {
      window.setTimeout(() => this.checkAnnualLimit(), 100);
    });
    this._amount.onAmountChange.subscribe(() => {
      window.setTimeout(() => this.checkAnnualLimit(), 100);
    });
    this.checkAnnualLimit();
    this.country.addEventListener("change", () => {
      const premiumGiftContainer = document.querySelector(
        ".en__component--premiumgiftblock"
      ) as HTMLElement;
      if (premiumGiftContainer) {
        premiumGiftContainer.removeAttribute("data-annual-disabled");
        this.checkAnnualLimit();
      }
    });
  }
  checkAnnualLimit() {
    if (this.annualLimit === 0 || this.country.value !== "US") return;
    const amount = this._amount.amount;
    if (this._frequency.frequency === "annual") {
      if (amount < this.annualLimit) {
        this.hidePremium();
      } else {
        this.showPremium();
      }
    } else {
      this.showPremium();
    }
  }
  showPremium() {
    const premiumGiftContainer = document.querySelector(
      ".en__component--premiumgiftblock"
    ) as HTMLElement;
    if (
      premiumGiftContainer &&
      !premiumGiftContainer.hasAttribute("data-disabled-message")
    ) {
      premiumGiftContainer.removeAttribute("disabled");
      premiumGiftContainer.removeAttribute("data-annual-disabled");
      this.logger.log("Premium Gift Container Show");
    }
  }
  hidePremium() {
    const premiumGiftContainer = document.querySelector(
      ".en__component--premiumgiftblock"
    ) as HTMLElement;
    if (
      premiumGiftContainer &&
      !premiumGiftContainer.hasAttribute("disabled")
    ) {
      this.maxMyGift();
      premiumGiftContainer.setAttribute("disabled", "disabled");
      premiumGiftContainer.setAttribute("data-annual-disabled", "true");
      this.logger.log("Premium Gift Container Hide");
    }
  }
  shouldRun() {
    const isPremiumGift = (window as any).pageJson.pageType === "premiumgift";
    const hasAnnualFrequency = document.querySelector(
      "[name='transaction.recurrfreq'][value='annual' i]"
    ) as HTMLInputElement;
    const hasPremiumGiftRules = ENGrid.checkNested(
      (window as any).EngagingNetworks,
      "premiumGifts",
      "rules",
      "single",
      "ranges"
    );
    const hasMonthlyFrequency = document.querySelector(
      "[name='transaction.recurrfreq'][value='monthly' i]"
    ) as HTMLInputElement;
    return (
      this.country &&
      isPremiumGift &&
      hasAnnualFrequency &&
      hasMonthlyFrequency &&
      hasPremiumGiftRules
    );
  }
  loadAnnualLimit() {
    // Check if there's a global variable for the premium annual limit
    if ("PremiumAnnualLimit" in window) {
      this.annualLimit = +(window as any).PremiumAnnualLimit;
      this.logger.log("Annual Limit From Global Variable", this.annualLimit);
      return;
    }
    const premiumGiftRules = (window as any).EngagingNetworks.premiumGifts
      .rules;
    let annualLimit = 0;
    for (let range in premiumGiftRules.single.ranges) {
      if (
        "productIds" in premiumGiftRules.single.ranges[range] &&
        premiumGiftRules.single.ranges[range].productIds.length === 0
      ) {
        annualLimit = +premiumGiftRules.single.ranges[range].limit;
      }
    }
    this.annualLimit = annualLimit;
    this.logger.log("Annual Limit From Single", this.annualLimit);
  }
  maxMyGift = () => {
    const maxRadio = document.querySelector(
      ".en__pg:last-child input[type='radio'][name='en__pg'][value='0']"
    ) as HTMLInputElement;
    if (maxRadio) {
      maxRadio.checked = true;
      maxRadio.click();
      setTimeout(() => {
        ENGrid.setFieldValue("transaction.selprodvariantid", "");
      }, 150);
    }
  };
}
