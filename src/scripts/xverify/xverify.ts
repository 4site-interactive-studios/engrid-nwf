import { EnForm, ENGrid, EngridLogger } from "@4site/engrid-common";
// import { EnForm, ENGrid } from "../../../../engrid-scripts/packages/common"; // Uses ENGrid via Visual Studio Workspace

export class XVerify {
  public form: EnForm = EnForm.getInstance();
  public emailField: HTMLInputElement;
  public apiURL: string;
  public emailWrapper = document.querySelector(
    ".en__field--emailAddress"
  ) as HTMLDivElement;
  public xvDate: HTMLInputElement | null = null;
  public xvDateFormat: string;
  public xvStatus: HTMLInputElement | null = null;
  private options: {
    statusField?: string;
    dateField?: string;
    dateFormat?: string;
  };
  private static instance: XVerify;
  private logger: EngridLogger = new EngridLogger(
    "XVerify",
    "blueviolet",
    "aliceblue",
    "🔍"
  );
  constructor(options: {
    statusField?: string;
    dateField?: string;
    dateFormat?: string;
  }) {
    this.emailField = <HTMLInputElement>(
      document.querySelector("#en__field_supporter_emailAddress")
    );
    this.options = options;
    this.xvStatus = this.options.statusField
      ? document.querySelector(`[name="${this.options.statusField}"]`)
      : null;
    this.xvDate = this.options.dateField
      ? document.querySelector(`[name="${this.options.dateField}"]`)
      : null;
    this.xvDateFormat = this.options.dateFormat
      ? this.options.dateFormat
      : "YYYY-MM-DD";
    this.apiURL =
      "https://www.xverify.com/services/emails/process/?type=json&autocorrect=0&apikey=nwf&domain=nwf.org&callback=validateXverify";
    if (this.options.statusField && !this.xvStatus) {
      this.xvStatus = ENGrid.createHiddenInput(this.options.statusField);
    }
    if (this.options.dateField && !this.xvDate) {
      this.xvDate = ENGrid.createHiddenInput(this.options.dateField);
    }
    this.init();
    this.logger.log("LOADED", this.emailField);
  }
  public static getInstance(options: {
    statusField?: string;
    dateField?: string;
    dateFormat?: string;
  }): XVerify {
    if (!XVerify.instance) {
      XVerify.instance = new XVerify(options);
    }
    return XVerify.instance;
  }
  private init() {
    if (!this.emailField) {
      this.logger.log("E-mail Field Not Found", this.emailField);
      return;
    }
    this.form.onValidate.subscribe(() => {
      if (this.form.validate) {
        this.logger.log("onValidate");
        this.form.validate = this.validateSubmit();
      }
    });
    "change paste".split(" ").forEach((e) => {
      this.emailField.addEventListener(e, (event) => {
        // Run after 100ms
        setTimeout(() => {
          this.validateEmail(this.emailField.value);
        }, 100);
      });
    });
    if (this.emailField.value) {
      this.validateEmail(this.emailField.value);
    }
    this.watchForRememberMe();
  }

  private deleteENFieldError() {
    const emailWrapper = <HTMLDivElement>this.emailField.closest(".en__field");
    emailWrapper.classList.remove("en__field--validationFailed");
    const errorField = <HTMLElement>(
      document.querySelector(".en__field--emailAddress>div.en__field__error")
    );
    if (errorField) errorField.remove();
  }

  private validateEmail(email: string, force: boolean = false) {
    const submit = document.querySelector(
      ".en__submit button"
    ) as HTMLButtonElement;
    // If the submit button is disabled and force is false, return
    if (submit && submit.disabled && !force) {
      this.logger.log("Submit Button Disabled");
      return true;
    }
    if (!this.emailField) {
      this.logger.log("E-mail Field Not Found. Returning true.");
      return true;
    }
    ENGrid.disableSubmit("Validating Your Email");
    ENGrid.loadJS(this.apiURL + "&email=" + email, () => {
      ENGrid.enableSubmit();
      if (force) {
        this.form.submitForm();
      }
    });
  }
  public static validateXverify(data: any) {
    const xvStatusList = {
      valid: "Valid",
      invalid: "Invalid",
      accept_all: "Catch All (Potential to Bounce)",
      risky: "High Risk",
      unknown: "Unknown",
    };
    if (ENGrid.debug) console.log("Engrid XVerify validateXverify():", data);
    const xv = window.hasOwnProperty("XVerifyOptions")
      ? XVerify.getInstance((<any>window).XVerifyOptions)
      : XVerify.getInstance({});

    if (xv.xvStatus) {
      xv.xvStatus.value = xvStatusList.hasOwnProperty(data.email.status)
        ? xvStatusList[data.email.status as keyof typeof xvStatusList]
        : data.email.status;
    }
    if (xv.xvDate) {
      xv.xvDate.value = xv.xvDate.value = ENGrid.formatDate(
        new Date(),
        xv.xvDateFormat
      );
    }
    xv.emailField.dataset.xverifyStatus = data.email.status;
    xv.emailField.dataset.xverifyDate = ENGrid.formatDate(
      new Date(),
      xv.xvDateFormat
    );
    if (
      !["accept_all", "unknown", "valid", "risky"].includes(data.email.status)
    ) {
      xv.emailField?.focus();
      if (ENGrid.debug)
        console.log("Engrid XVerify validateXverify():", "INVALID");
      xv.invalid(data.email.message);
      return false;
    }
    if (ENGrid.debug) console.log("Engrid XVerify validateXverify():", "VALID");
    xv.valid();
    return true;
  }
  public validateSubmit() {
    if (
      this.emailField &&
      this.emailField.value !== "" &&
      !this.emailField.dataset.hasOwnProperty("xverifyStatus")
    ) {
      this.logger.log("XVerify Status Not Found. Force Validating Email");
      this.validateEmail(this.emailField.value, true);
      return false;
    }
    if (
      !!["accept_all", "unknown", "valid", "risky"].includes(
        this.emailField.dataset.xverifyStatus || ""
      )
    ) {
      this.valid();
      return true;
    }
    this.invalid();
    return false;
  }
  public valid() {
    this.deleteENFieldError();
  }
  public invalid(message: string = "Invalid Email") {
    this.deleteENFieldError();
    const emailWrapper = <HTMLDivElement>this.emailField.closest(".en__field");
    emailWrapper.classList.add("en__field--validationFailed");
    const emailError = document.createElement("div");
    emailError.id = "engridEmailValidator";
    emailError.classList.add("en__field__error");
    emailError.innerHTML = message;
    emailWrapper.prepend(emailError);
  }

  /**
   * Watches for changes in the email field's parent element to detect when the "remember me" link is added.
   * If the "remember me" link is added, validates the email field and logs a message to the console if debug mode is enabled.
   */
  private watchForRememberMe() {
    const emailWrapper = <HTMLDivElement>this.emailField.parentElement;

    if (emailWrapper) {
      const mutationCallback: MutationCallback = (mutationsList, obs) => {
        for (let mutation of mutationsList) {
          if (mutation.type === "childList") {
            for (let addedNode of mutation.addedNodes) {
              if (
                addedNode instanceof HTMLElement &&
                addedNode.id === "clear-autofill-data"
              ) {
                window.setTimeout(() => {
                  this.validateEmail(this.emailField.value);
                  this.logger.log("REMEMBERME");
                }, 100);
              }
            }
          }
        }
      };

      const observer = new MutationObserver(mutationCallback);
      const config: MutationObserverInit = { childList: true };
      observer.observe(emailWrapper, config);
    }
  }
}
