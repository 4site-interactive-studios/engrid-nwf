import { EnForm, ENGrid } from "@4site/engrid-common";

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
      ? document.querySelector(this.options.statusField)
      : null;
    this.xvDate = this.options.dateField
      ? document.querySelector(this.options.dateField)
      : null;
    this.xvDateFormat = this.options.dateFormat
      ? this.options.dateFormat
      : "YYYY-MM-DD";
    this.apiURL =
      "https://www.xverify.com/services/emails/process/?type=json&autocorrect=0&apikey=nwf&domain=nwf.org&callback=validateXverify";
    this.init();
    this.form.onValidate.subscribe(
      () => (this.form.validate = this.validateSubmit())
    );
    if (ENGrid.debug) console.log("Engrid Xverify: LOADED", this.emailField);
  }
  public static getInstance(options: {
    statusField?: string;
    dateField?: string;
  }): XVerify {
    if (!XVerify.instance) {
      XVerify.instance = new XVerify(options);
    }
    return XVerify.instance;
  }
  private init() {
    if (!this.emailField) {
      if (ENGrid.debug)
        console.log("Engrid Xverify: E-mail Field Not Found", this.emailField);
      return;
    }
    "change paste".split(" ").forEach((e) => {
      this.emailField.addEventListener(e, (event) => {
        // Run after 50ms
        setTimeout(() => {
          this.validateEmail(this.emailField.value);
        }, 50);
      });
    });
    if (this.emailField.value) {
      this.validateEmail(this.emailField.value);
    }
  }

  private deleteENFieldError() {
    const emailWrapper = <HTMLDivElement>this.emailField.closest(".en__field");
    emailWrapper.classList.remove("en__field--validationFailed");
    const errorField = <HTMLElement>(
      document.querySelector(".en__field--emailAddress>div.en__field__error")
    );
    if (errorField) errorField.remove();
  }

  private validateEmail(email: string) {
    if (!this.emailField) {
      if (ENGrid.debug)
        console.log(
          "Engrid XVerify validate(): E-mail Field Not Found. Returning true."
        );
      return true;
    }
    ENGrid.disableSubmit("Validating Your Email");
    ENGrid.loadJS(this.apiURL + "&email=" + email, () => {
      ENGrid.enableSubmit();
    });
  }
  public static validateXverify(data: any) {
    if (ENGrid.debug) console.log("Engrid XVerify validateXverify():", data);
    const xv = window.hasOwnProperty("XVerifyOptions")
      ? XVerify.getInstance((<any>window).XVerifyOptions)
      : XVerify.getInstance({});

    if (xv.xvStatus) {
      xv.xvStatus.value = data.email.status;
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
}
