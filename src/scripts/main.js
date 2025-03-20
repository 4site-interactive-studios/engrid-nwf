const tippy = require("tippy.js").default;
const monthlyAnimationData = require("./monthly-animation.json");
const shuffleSeed = require("shuffle-seed");

export const customScript = function (DonationFrequency, App) {
  App.log("ENGrid client scripts are executing");
  // Add your client scripts here

  // PREMIUMS SCRIPTS - START

  // const freq = DonationFrequency.getInstance();

  // if (
  //   "pageJson" in window &&
  //   "pageType" in window.pageJson &&
  //   window.pageJson.pageType === "premiumgift"
  // ) {
  //   const country = App.getField("supporter.country");
  //   const maxMyGift = () => {
  //     const maxRadio = document.querySelector(
  //       ".en__pg:last-child input[type='radio'][name='en__pg'][value='0']"
  //     );
  //     if (maxRadio) {
  //       maxRadio.checked = true;
  //       maxRadio.click();
  //       setTimeout(() => {
  //         App.setFieldValue("transaction.selprodvariantid", "");
  //       }, 150);
  //     }
  //   };

  //   const selectPremiumFromSession = () => {
  //     const selectedPremiumId = sessionStorage.getItem("selectedPremiumId");
  //     const selectedVariantId = sessionStorage.getItem("selectedVariantId");
  //     if (selectedPremiumId && selectedVariantId) {
  //       const selectedGift = document.querySelector(
  //         `input[type="radio"][name="en__pg"][value="${selectedPremiumId}"]`
  //       );
  //       if (selectedGift) {
  //         selectedGift.click();
  //         window.setTimeout(() => {
  //           App.setFieldValue(
  //             "transaction.selprodvariantid",
  //             selectedVariantId
  //           );
  //         }, 100);
  //       }
  //     }
  //   };

  //   const disablePremiumBlock = (message = "Gifts Disabled") => {
  //     const premiumBlock = document.querySelector(
  //       ".en__component--premiumgiftblock"
  //     );
  //     if (!premiumBlock || premiumBlock.dataset.dataAnnualDisabled === "true") {
  //       return;
  //     }
  //     if (!premiumBlock.hasAttribute("disabled")) {
  //       // Keep the page scroll position when the premium block is disabled (hidden)
  //       const scrollY = window.scrollY;
  //       const premiumStyle = window.getComputedStyle(premiumBlock);
  //       const premiumSize =
  //         parseInt(premiumStyle.height, 10) +
  //         parseInt(premiumStyle.marginTop.replace("px", "")) +
  //         parseInt(premiumStyle.marginBottom.replace("px", ""));
  //       premiumBlock.setAttribute("disabled", "disabled");
  //       premiumBlock.setAttribute("aria-disabled", "true");
  //       premiumBlock.setAttribute("data-disabled-message", message);
  //       window.scrollTo(0, scrollY - premiumSize);
  //       console.log(premiumSize);
  //     }
  //   };

  //   const enablePremiumBlock = () => {
  //     const premiumBlock = document.querySelector(
  //       ".en__component--premiumgiftblock"
  //     );
  //     if (!premiumBlock || premiumBlock.dataset.dataAnnualDisabled === "true") {
  //       return;
  //     }
  //     if (premiumBlock.hasAttribute("disabled")) {
  //       // Keep the page scroll position when the premium block is enabled (shown)
  //       const scrollY = window.scrollY;
  //       const premiumStyle = window.getComputedStyle(premiumBlock);
  //       premiumBlock.removeAttribute("disabled");
  //       premiumBlock.removeAttribute("aria-disabled");
  //       premiumBlock.removeAttribute("data-disabled-message");
  //       const premiumSize =
  //         parseInt(premiumStyle.height, 10) +
  //         parseInt(premiumStyle.marginTop.replace("px", "")) +
  //         parseInt(premiumStyle.marginBottom.replace("px", ""));
  //       window.scrollTo(0, scrollY + premiumSize);
  //       console.log(premiumSize);
  //     }
  //   };
  //   const addCountryNotice = () => {
  //     if (!document.querySelector(".en__field--country .en__field__notice")) {
  //       App.addHtml(
  //         '<div class="en__field__notice"><strong>Note:</strong> We are unable to mail thank-you gifts to donors outside the United States and its territories and have selected the "Mazimize my gift" option for you.</div>',
  //         ".en__field--country .en__field__element",
  //         "after"
  //       );
  //     }
  //   };
  //   const removeCountryNotice = () => {
  //     App.removeHtml(".en__field--country .en__field__notice");
  //   };
  //   if (
  //     !window.EngagingNetworks.require._defined.enjs.checkSubmissionFailed()
  //   ) {
  //     maxMyGift();
  //   } else {
  //     window.setTimeout(() => {
  //       selectPremiumFromSession();
  //     }, 1000);
  //   }
  //   if (App.getUrlParameter("premium") !== "international" && country) {
  //     if (country.value !== "US") {
  //       const countryText = country.options[country.selectedIndex].text;
  //       maxMyGift();
  //       disablePremiumBlock(`Gifts Disabled in ${countryText}`);
  //       addCountryNotice();
  //     }
  //     country.addEventListener("change", () => {
  //       if (country.value !== "US") {
  //         const countryText = country.options[country.selectedIndex].text;
  //         maxMyGift();
  //         disablePremiumBlock(`Gifts Disabled in ${countryText}`);
  //         addCountryNotice();
  //       } else {
  //         enablePremiumBlock();
  //         removeCountryNotice();
  //       }
  //     });
  //     freq.onFrequencyChange.subscribe((s) => {
  //       if (country.value !== "US") {
  //         const countryText = country.options[country.selectedIndex].text;
  //         maxMyGift();
  //         disablePremiumBlock(`Gifts Disabled in ${countryText}`);
  //       } else {
  //         enablePremiumBlock();
  //       }
  //     });
  //   }
  //   const premiumBlock = document.querySelector(
  //     ".en__component--premiumgiftblock"
  //   );
  //   if (premiumBlock) {
  //     //listen for the change event of name "en__pg" using event delegation
  //     let selectedPremiumId = null;
  //     let selectedVariantId = null;
  //     ["change", "click"].forEach((event) => {
  //       premiumBlock.addEventListener(event, (e) => {
  //         setTimeout(() => {
  //           const selectedGift = document.querySelector(
  //             '[name="en__pg"]:checked'
  //           );
  //           if (selectedGift) {
  //             selectedPremiumId = selectedGift.value;
  //             selectedVariantId = App.getFieldValue(
  //               "transaction.selprodvariantid"
  //             );
  //             if (selectedPremiumId > 0) {
  //               // Save the selected gift and variant id to the session storage
  //               sessionStorage.setItem("selectedPremiumId", selectedPremiumId);
  //               sessionStorage.setItem("selectedVariantId", selectedVariantId);
  //             }
  //           }
  //         }, 250);
  //       });
  //     });

  //     // Mutation observer to check if the "Maximized Their Gift" radio button is present. If it is, hide it.
  //     const observer = new MutationObserver((mutationsList) => {
  //       //loop over the mutations and if we're adding a radio with the "checked" attribute, remove that attribute so nothing gets re-selected
  //       //when the premiums list is re-rendered
  //       for (const mutation of mutationsList) {
  //         if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
  //           mutation.addedNodes.forEach((node) => {
  //             if (typeof node.querySelector !== "function") return;
  //             const preSelectedRadio = node.querySelector("input[checked]");
  //             if (preSelectedRadio) {
  //               preSelectedRadio.removeAttribute("checked");
  //             }
  //           });
  //         }
  //       }

  //       if (mutationsList.some((mutation) => mutation.type === "childList")) {
  //         // Re-select the previously selected gift when gift list is re-rendered
  //         // If gift no longer exists, choose maximize my gift
  //         if (selectedPremiumId && selectedVariantId) {
  //           const selectedGift = document.querySelector(
  //             `input[type="radio"][name="en__pg"][value="${selectedPremiumId}"]`
  //           );
  //           if (selectedGift) {
  //             selectedGift.click();
  //             window.setTimeout(() => {
  //               App.setFieldValue(
  //                 "transaction.selprodvariantid",
  //                 selectedVariantId
  //               );
  //             }, 100);
  //           } else {
  //             maxMyGift();
  //           }
  //         } else {
  //           maxMyGift();
  //         }
  //       }
  //     });
  //     // Start observing the target node for configured mutations
  //     observer.observe(premiumBlock, {
  //       attributes: true,
  //       childList: true,
  //       subtree: true,
  //     });
  //   }
  // }

  // PREMIUMS SCRIPTS - END

  // Add "(Optional)" to the PhoneNumber2 field label if the field is not required
  const enFieldPhoneNumber2Label = document.querySelector(
    "label[for='en__field_supporter_phoneNumber2']"
  );

  const enFieldPhoneNumber2Required = document.querySelector(
    ".en__mandatory > * > input#en__field_supporter_phoneNumber2"
  );

  if (enFieldPhoneNumber2Label && !enFieldPhoneNumber2Required) {
    enFieldPhoneNumber2Label.insertAdjacentHTML("beforeend", " (Optional)");
  }

  // Remove (Optional) from the Home Phone field placeholder
  const enFieldHomePhonePlaceholder = document.querySelector(
    '[name="supporter.phoneNumber"]'
  );

  if (enFieldHomePhonePlaceholder) {
    enFieldHomePhonePlaceholder.placeholder = "Phone Number";
  }

  // Add "Why is this required?" markup to the Title field
  // Only show it if the Title field is marked as required
  let titleLabel = document.querySelectorAll(
    ".en__field--title.en__mandatory > label"
  )[0];
  let pageType;
  if ("pageJson" in window && "pageType" in window.pageJson) {
    pageType = window.pageJson.pageType;
  }
  if (titleLabel && pageType === "emailtotarget") {
    let el = document.createElement("span");
    let childEl = document.createElement("a");
    childEl.href = "#";
    childEl.id = "title-tooltip";
    childEl.className = "label-tooltip";
    childEl.tabIndex = "-1";
    childEl.innerText = "Why is this required?";
    childEl.addEventListener("click", (e) => e.preventDefault());
    el.appendChild(childEl);
    titleLabel.appendChild(el);
    tippy("#title-tooltip", {
      content:
        "Why is title required? The U.S. Senate currently requires that messages to Senators include one of these five titles: Mr., Mrs., Miss, Ms., Dr. We understand that not everyone identifies with one of these titles, and we have provided additional options. However, to ensure your message can be received by your Senators, you may need to select one of the five titles described above.",
    });
  }

  // In the support hub style donation amount radio selects like buttons
  if (document.querySelector(".en__component--hubgadget")) {
    document.body.classList.add("radio-to-buttons_donationAmt");
  }

  //NWF2 theme scripts
  if (document.body.dataset.engridTheme === "nwf2") {
    //adjust tippy props
    const figAttributions = document.querySelectorAll(
      ".media-with-attribution figattribution"
    );

    figAttributions.forEach((figAttribution) => {
      const tippyInstance = figAttribution._tippy;
      if (tippyInstance) {
        tippyInstance.setProps({
          arrow: false,
          allowHTML: true,
        });
      }
    });

    // Position monthly upsell after the recurring frequency field
    let inlineMonthlyUpsell = document.querySelector(
      ".move-after--transaction-recurrfreq"
    );
    let recurrFrequencyField = document.querySelector(".en__field--recurrfreq");
    if (inlineMonthlyUpsell && recurrFrequencyField) {
      recurrFrequencyField.insertAdjacentElement(
        "beforeend",
        inlineMonthlyUpsell
      );
    }

    App.loadJS(
      "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js",
      () => {
        const monthlyAnimation = lottie.loadAnimation({
          container: document.querySelector(
            "#en__field_transaction_recurrfreq1 + label"
          ), // the dom element that will contain the animation
          renderer: "svg",
          animationData: monthlyAnimationData,
          autoplay: false,
          loop: false,
        });

        const freq = DonationFrequency.getInstance();
        freq.onFrequencyChange.subscribe((frequency) => {
          if (frequency === "monthly") {
            monthlyAnimation.play();
          } else {
            monthlyAnimation.goToAndStop(0);
          }
        });
      }
    );
  }

  // Use the window.EngridDefaultDigitalWallets variable in a code block to set the default payment method to GooglePay / ApplePay
  const digitalWalletRadio = document.querySelector(
    "input[name='transaction.giveBySelect'][value='stripedigitalwallet']"
  );
  if (
    digitalWalletRadio &&
    window.EngridDefaultDigitalWallets &&
    window.EngridDefaultDigitalWallets === true
  ) {
    const setDigitalWalletPaymentMethod = () => {
      digitalWalletRadio.checked = true;
      digitalWalletRadio.dispatchEvent(
        new Event("change", {
          bubbles: true,
          cancelable: true,
        })
      );
    };

    const applePay = document.body.getAttribute(
      "data-engrid-payment-type-option-apple-pay"
    );
    const googlePay = document.body.getAttribute(
      "data-engrid-payment-type-option-google-pay"
    );
    if (applePay === "true" || googlePay === "true") {
      setDigitalWalletPaymentMethod();
    } else {
      let observerFinished = false;
      const digitalWalletsObserver = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          if (mutation.type === "attributes" && !observerFinished) {
            const applePay = document.body.getAttribute(
              "data-engrid-payment-type-option-apple-pay"
            );
            const googlePay = document.body.getAttribute(
              "data-engrid-payment-type-option-google-pay"
            );
            if (applePay === "true" || googlePay === "true") {
              setDigitalWalletPaymentMethod();
              observerFinished = true; // prevent multiple runs if both attribute changes are in the same batch
              digitalWalletsObserver.disconnect();
            }
          }
        });
      });
      digitalWalletsObserver.observe(document.body, {
        attributes: true,
        attributeFilter: [
          "data-engrid-payment-type-option-apple-pay",
          "data-engrid-payment-type-option-google-pay",
        ],
      });
    }
  }
};

export class DonorScroll {
  constructor() {
    if (
      !document.querySelector(".donor-list") &&
      !document.querySelector("#donor-ticker")
    )
      return;

    this.donors = [];
    // Retrieve saved state from localStorage
    const savedState = this.getLocalStorage("tickerState");
    // Set initial state and label
    this.isPaused = savedState === "paused";
    this.layout = "normal";
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion)"
    ).matches;

    const donorList = document.querySelectorAll(".donor-list li");
    if (donorList.length > 0) {
      donorList.forEach((donor) => this.donors.push(donor.innerText));
    } else {
      // Default donors
      this.donors = [
        "Aniko J. donated $103.00 ",
        "Alaine C. donated $36.05 ",
        "Crystal C. donated $154.50 ",
        "Dianne M. donated $51.50 ",
        "David L. donated $72.10 ",
        "Stuart S. donated $10.00 ",
        "John A. donated $154.50 ",
        "Katherine H. donated $30.00 ",
        "Lyn A. donated $18.00 ",
        "Stephanie W. donated $8.00 ",
        "Faith Z. donated $36.05 ",
        "Susan B. donated $55.62 ",
        "Ronald B. donated $100.00 ",
        "Sandra A. donated $30.90 ",
        "Jennifer R. donated $25.75 ",
        "Wendy M. donated $103.00 ",
        "Bonnie E. donated $10.30 ",
        "Linda O. donated $36.05 ",
        "Vicki A. donated $25.75 ",
        "Barbara P. donated $12.00 ",
        "Kathleen W. donated $300.00 ",
        "Severine B. donated $100.00 ",
        "Susan L. donated $50.00 ",
        "Stephanie C. donated $25.75 ",
        "Lynda G. donated $35.00 ",
        "Ruth Marie M. donated $50.00 ",
        "Ann K. donated $51.50 ",
        "Rafael C. donated $20.60 ",
        "Judith H. donated $30.00 ",
        "Francesca K. donated $30.00 ",
        "Ruth R. donated $60.00 ",
        "A.J. S. donated $51.50 ",
        "Elaine C. donated $30.90 ",
        "Lara M. donated $100.00 ",
        "Zora V. donated $257.50 ",
        "Karen B. donated $35.00 ",
        "Russell L. donated $51.50 ",
        "Sue G. donated $25.00 ",
        "Susanne M. donated $25.00 ",
        "Dennis B. donated $30.90 ",
        "James A. donated $51.50 ",
        "Linda K. donated $10.30 ",
        "Luka W. donated $15.00 ",
        "Mary D. donated $51.50 ",
        "Wendy L. donated $30.00 ",
        "Debby R. donated $25.75 ",
        "Suzy G. donated $18.00 ",
        "Inger H. donated $55.00 ",
        "Linda L. donated $20.00 ",
      ];
    }

    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (this.prefersReducedMotion) {
          this.isPaused = true;
        }
        this.createTickerContainer();
        this.displayDonations(this.getDonors());
        this.addAccessibilityControls();
        this.addHoverAndFocusControls();
      });
    } else {
      if (this.prefersReducedMotion) {
        this.isPaused = true;
      }
      this.createTickerContainer();
      this.displayDonations(this.getDonors());
      this.addAccessibilityControls();
      this.addHoverAndFocusControls();
    }
  }

  createTickerContainer() {
    const parentContainer = document.createElement("div");
    parentContainer.id = "ticker-container";

    const existingTicker = document.querySelector("#donor-ticker");
    if (existingTicker) {
      existingTicker.dataset.playing = this.isPaused ? "false" : "true";
      if ("layout" in existingTicker.dataset) {
        this.layout = existingTicker.dataset.layout;
        parentContainer.dataset.layout = this.layout;
      }
      // If layout is full, add parent container to #engrid
      if (this.layout === "full") {
        const engrid = document.querySelector("#engrid");
        if (engrid) {
          parentContainer.appendChild(existingTicker);
          engrid.appendChild(parentContainer);
        }
      } else {
        // Otherwise, add parent container before the existing
        existingTicker.parentElement.insertBefore(
          parentContainer,
          existingTicker
        );
        parentContainer.appendChild(existingTicker);
      }
    }
  }

  getDonors(total = 50) {
    const seed = this.getSeed();
    let donors = this.donors;

    while (donors.length < total) {
      donors = donors.concat(shuffleSeed.shuffle(this.donors, seed));
    }

    return shuffleSeed.shuffle(donors, seed).slice(0, total);
  }

  getSeed() {
    const now = new Date();
    const day = now.getDate();
    return day + this.getPageId();
  }

  getPageId() {
    return 1;
  }

  setLocalStorage(key, value) {
    localStorage.setItem(key, value);
  }

  getLocalStorage(key) {
    return localStorage.getItem(key);
  }

  removeLocalStorage(key) {
    localStorage.removeItem(key);
  }

  displayDonations(donors) {
    const tickerElement = document.querySelector("#donor-ticker");

    if (!tickerElement) {
      console.error("Ticker element not found");
      return;
    }

    tickerElement.innerHTML = `<div class="ticker">${donors
      .map((donor) => `<div class="ticker__item">${donor}</div>`)
      .join("")}</div>`;
  }

  addAccessibilityControls() {
    const parentContainer = document.querySelector("#ticker-container");
    if (!parentContainer) return;

    const pauseButton = document.createElement("button");
    pauseButton.setAttribute("type", "button"); // Explicitly set button type

    pauseButton.innerText = this.isPaused ? "Play" : "Pause";
    pauseButton.setAttribute(
      "aria-label",
      this.isPaused ? "Play scrolling" : "Pause scrolling"
    );
    pauseButton.setAttribute("tabindex", "0"); // Ensure button is focusable

    // Append the button to the container
    parentContainer.insertAdjacentElement("afterbegin", pauseButton);

    // Add toggle functionality
    pauseButton.onclick = () => {
      this.togglePauseScrolling(); // Toggle pause state
    };
  }

  togglePauseScrolling() {
    const pauseButton = document.querySelector("#ticker-container button");
    if (!pauseButton) return;
    this.isPaused = !this.isPaused;

    // Update label and aria-label
    pauseButton.innerText = this.isPaused ? "Play" : "Pause";
    pauseButton.setAttribute(
      "aria-label",
      this.isPaused ? "Play scrolling" : "Pause scrolling"
    );

    // Save the state in localStorage
    this.setLocalStorage("tickerState", this.isPaused ? "paused" : "playing");

    // Update the ticker's data-playing attribute
    const tickerContainer = document.querySelector("#donor-ticker");
    if (tickerContainer) {
      tickerContainer.setAttribute(
        "data-playing",
        this.isPaused ? "false" : "true"
      );
    }
  }

  addHoverAndFocusControls() {
    const tickerContainer = document.querySelector("#donor-ticker");
    if (!tickerContainer) return;

    // Ensure ticker is focusable for keyboard navigation
    tickerContainer.setAttribute("tabindex", "0");

    // Track whether the user explicitly paused the ticker
    let userPaused = this.isPaused;

    // Pause on hover and update data-hovered
    tickerContainer.addEventListener("mouseenter", () => {
      if (!this.isPaused) {
        this.isPaused = true; // Temporarily pause scrolling
        tickerContainer.setAttribute("data-hovered", "true");
        tickerContainer.setAttribute("data-playing", "false");
      }
    });

    tickerContainer.addEventListener("mouseleave", () => {
      tickerContainer.setAttribute("data-hovered", "false");
      if (!userPaused) {
        this.isPaused = false; // Resume scrolling only if not paused by the user
        tickerContainer.setAttribute("data-playing", "true");
      }
    });

    // Pause on focus
    tickerContainer.addEventListener("focusin", () => {
      this.wasPausedBeforeFocus = this.isPaused; // Track if it was paused by the user
      this.isPaused = true; // Pause scrolling
      tickerContainer.setAttribute("data-focused", "true");
      tickerContainer.setAttribute("data-playing", "false");
    });

    // Resume on blur (only if it wasn't paused by the user)
    tickerContainer.addEventListener("focusout", () => {
      tickerContainer.setAttribute("data-focused", "false");
      if (!this.wasPausedBeforeFocus && !userPaused) {
        this.isPaused = false; // Resume scrolling
        tickerContainer.setAttribute("data-playing", "true");
      }
    });

    // Update userPaused state on button click
    const pauseButton = document.querySelector("#ticker-container button");
    if (pauseButton) {
      pauseButton.addEventListener("click", () => {
        userPaused = this.isPaused;
      });
    }
  }
}

// Initialize DonorScroll immediately when the script loads
new DonorScroll();
