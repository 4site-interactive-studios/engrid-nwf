const tippy = require("tippy.js").default;

export const customScript = function () {
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
};
