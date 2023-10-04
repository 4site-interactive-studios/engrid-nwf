const tippy = require("tippy.js").default;
const monthlyAnimationData = require('./monthly-animation.json');

export const customScript = function (DonationFrequency, App) {
  console.log("ENGrid client scripts are executing");
  // Add your client scripts here

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
  if (document.body.dataset.engridTheme === 'nwf2') {
    //adjust tippy props
    const figAttributions = document.querySelectorAll(".media-with-attribution figattribution");

    figAttributions.forEach((figAttribution) => {
      const tippyInstance = figAttribution._tippy;
      if (tippyInstance) {
        tippyInstance.setProps({
          arrow: false,
          allowHTML: true
        })
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

    App.loadJS('https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js', () => {
      const monthlyAnimation = lottie.loadAnimation({
        container: document.querySelector('#en__field_transaction_recurrfreq1 + label'), // the dom element that will contain the animation
        renderer: 'svg',
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
    });
  }
};
