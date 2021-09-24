import crumbs from "./crumbs";
export class FormSwitch {
  // As options we expect an object with PaymentValue: ENFormID
  // Example: {PayPal: 9384, ACH: 9397}
  constructor(options) {
    this.options = options;
    this.paymentType = document.getElementById(
      "en__field_transaction_paymenttype"
    );
    this.form = document.querySelector("form.en__component");
    if (!this.shouldRun()) {
      // If we're not on a Donation Page, get out
      return false;
    }
    this.formAction = this.form.getAttribute("action");

    // When the payment type gets changed, check if we need to change the form action
    this.paymentType.addEventListener(
      "change",
      this.switchFormAction.bind(this)
    );
    // We're doing this because sometimes the payment type gets changed
    // programatically and it doesn't trigger the change event
    document.querySelectorAll("input[type='radio']").forEach((e) => {
      e.addEventListener("change", () =>
        window.setTimeout(this.switchFormAction.bind(this), 500)
      );
    });

    window.setTimeout(this.switchFormAction(), 500);
  }
  // Should we run the script?
  shouldRun() {
    // Check if we have a PageID cookie that's different from current PageID
    let pageID = crumbs.ls.get("PageID");
    console.log("Check PageID Stored", pageID);
    console.log("Check PageID Current", this.getPageID());
    if (pageID && pageID != this.getPageID()) {
      let url = (location.pathname + location.search).replace(
        /([0-9])+/,
        pageID
      );
      console.log("Redirecting to", url);
      crumbs.ls.delete("PageID");
      location.href = url;
      return false;
    }
    console.log(
      "Should Run?",
      !!Object.keys(this.options).length && !!this.form && !!this.paymentType
    );
    // if options are empty or we can't find Form or PaymentType DropDown, don't run
    return (
      !!Object.keys(this.options).length && !!this.form && !!this.paymentType
    );
  }

  // Return the current page ID

  getPageID() {
    if (!window.pageJson) return 0;
    return window.pageJson.campaignPageId;
  }

  // Switch Form Action
  switchFormAction() {
    let payment =
      this.paymentType.options[this.paymentType.selectedIndex].value;
    if (this.options.hasOwnProperty(payment)) {
      console.log("Form Switch Found!", this.options[payment]);
      this.form.setAttribute(
        "action",
        this.form
          .getAttribute("action")
          .replace(/([0-9])+/, this.options[payment])
      );
      crumbs.ls.set("PageID", this.getPageID()); // Create session cookie
    } else {
      this.form.setAttribute("action", this.formAction);
      // crumbs.ls.delete("PageID"); // Delete session cookie
    }
    console.log(this.form.getAttribute("action"));
    console.log();
  }
}
