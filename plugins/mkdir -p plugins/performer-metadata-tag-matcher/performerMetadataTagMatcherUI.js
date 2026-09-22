(function () {
  "use strict";

  var BUTTON_ID = "performer-metadata-tag-matcher-button";
  var OBSERVER_DELAY_MS = 400;

  var COUNTRY_NAMES = {
    AD: "Andorra",
    AE: "United Arab Emirates",
    AF: "Afghanistan",
    AG: "Antigua and Barbuda",
    AI: "Anguilla",
    AL: "Albania",
    AM: "Armenia",
    AO: "Angola",
    AQ: "Antarctica",
    AR: "Argentina",
    AS: "American Samoa",
    AT: "Austria",
    AU: "Australia",
    AW: "Aruba",
    AX: "Aland Islands",
    AZ: "Azerbaijan",
    BA: "Bosnia and Herzegovina",
    BB: "Barbados",
    BD: "Bangladesh",
    BE: "Belgium",
    BF: "Burkina Faso",
    BG: "Bulgaria",
    BH: "Bahrain",
    BI: "Burundi",
    BJ: "Benin",
    BL: "Saint Barthelemy",
    BM: "Bermuda",
    BN: "Brunei",
    BO: "Bolivia",
    BQ: "Bonaire, Sint Eustatius and Saba",
    BR: "Brazil",
    BS: "Bahamas",
    BT: "Bhutan",
    BV: "Bouvet Island",
    BW: "Botswana",
    BY: "Belarus",
    BZ: "Belize",
    CA: "Canada",
    CC: "Cocos Islands",
    CD: "Democratic Republic of the Congo",
    CF: "Central African Republic",
    CG: "Congo",
    CH: "Switzerland",
    CI: "Ivory Coast",
    CK: "Cook Islands",
    CL: "Chile",
    CM: "Cameroon",
    CN: "China",
    CO: "Colombia",
    CR: "Costa Rica",
    CU: "Cuba",
    CV: "Cape Verde",
    CW: "Curacao",
    CX: "Christmas Island",
    CY: "Cyprus",
    CZ: "Czechia",
    DE: "Germany",
    DJ: "Djibouti",
    DK: "Denmark",
    DM: "Dominica",
    DO: "Dominican Republic",
    DZ: "Algeria",
    EC: "Ecuador",
    EE: "Estonia",
    EG: "Egypt",
    EH: "Western Sahara",
    ER: "Eritrea",
    ES: "Spain",
    ET: "Ethiopia",
    FI: "Finland",
    FJ: "Fiji",
    FK: "Falkland Islands",
    FM: "Micronesia",
    FO: "Faroe Islands",
    FR: "France",
    GA: "Gabon",
    GB: "United Kingdom",
    GD: "Grenada",
    GE: "Georgia",
    GF: "French Guiana",
    GG: "Guernsey",
    GH: "Ghana",
    GI: "Gibraltar",
    GL: "Greenland",
    GM: "Gambia",
    GN: "Guinea",
    GP: "Guadeloupe",
    GQ: "Equatorial Guinea",
    GR: "Greece",
    GT: "Guatemala",
    GU: "Guam",
    GW: "Guinea-Bissau",
    GY: "Guyana",
    HK: "Hong Kong",
    HN: "Honduras",
    HR: "Croatia",
    HT: "Haiti",
    HU: "Hungary",
    ID: "Indonesia",
    IE: "Ireland",
    IL: "Israel",
    IM: "Isle of Man",
    IN: "India",
    IQ: "Iraq",
    IR: "Iran",
    IS: "Iceland",
    IT: "Italy",
    JE: "Jersey",
    JM: "Jamaica",
    JO: "Jordan",
    JP: "Japan",
    KE: "Kenya",
    KG: "Kyrgyzstan",
    KH: "Cambodia",
    KI: "Kiribati",
    KM: "Comoros",
    KN: "Saint Kitts and Nevis",
    KP: "North Korea",
    KR: "South Korea",
    KW: "Kuwait",
    KY: "Cayman Islands",
    KZ: "Kazakhstan",
    LA: "Laos",
    LB: "Lebanon",
    LC: "Saint Lucia",
    LI: "Liechtenstein",
    LK: "Sri Lanka",
    LR: "Liberia",
    LS: "Lesotho",
    LT: "Lithuania",
    LU: "Luxembourg",
    LV: "Latvia",
    LY: "Libya",
    MA: "Morocco",
    MC: "Monaco",
    MD: "Moldova",
    ME: "Montenegro",
    MF: "Saint Martin",
    MG: "Madagascar",
    MH: "Marshall Islands",
    MK: "North Macedonia",
    ML: "Mali",
    MM: "Myanmar",
    MN: "Mongolia",
    MO: "Macao",
    MP: "Northern Mariana Islands",
    MQ: "Martinique",
    MR: "Mauritania",
    MS: "Montserrat",
    MT: "Malta",
    MU: "Mauritius",
    MV: "Maldives",
    MW: "Malawi",
    MX: "Mexico",
    MY: "Malaysia",
    MZ: "Mozambique",
    NA: "Namibia",
    NC: "New Caledonia",
    NE: "Niger",
    NF: "Norfolk Island",
    NG: "Nigeria",
    NI: "Nicaragua",
    NL: "Netherlands",
    NO: "Norway",
    NP: "Nepal",
    NR: "Nauru",
    NU: "Niue",
    NZ: "New Zealand",
    OM: "Oman",
    PA: "Panama",
    PE: "Peru",
    PF: "French Polynesia",
    PG: "Papua New Guinea",
    PH: "Philippines",
    PK: "Pakistan",
    PL: "Poland",
    PM: "Saint Pierre and Miquelon",
    PR: "Puerto Rico",
    PS: "Palestine",
    PT: "Portugal",
    PW: "Palau",
    PY: "Paraguay",
    QA: "Qatar",
    RE: "Reunion",
    RO: "Romania",
    RS: "Serbia",
    RU: "Russia",
    RW: "Rwanda",
    SA: "Saudi Arabia",
    SB: "Solomon Islands",
    SC: "Seychelles",
    SD: "Sudan",
    SE: "Sweden",
    SG: "Singapore",
    SH: "Saint Helena",
    SI: "Slovenia",
    SK: "Slovakia",
    SL: "Sierra Leone",
    SM: "San Marino",
    SN: "Senegal",
    SO: "Somalia",
    SR: "Suriname",
    SS: "South Sudan",
    ST: "Sao Tome and Principe",
    SV: "El Salvador",
    SX: "Sint Maarten",
    SY: "Syria",
    SZ: "Eswatini",
    TC: "Turks and Caicos Islands",
    TD: "Chad",
    TG: "Togo",
    TH: "Thailand",
    TJ: "Tajikistan",
    TL: "Timor-Leste",
    TM: "Turkmenistan",
    TN: "Tunisia",
    TO: "Tonga",
    TR: "Turkey",
    TT: "Trinidad and Tobago",
    TV: "Tuvalu",
    TW: "Taiwan",
    TZ: "Tanzania",
    UA: "Ukraine",
    UG: "Uganda",
    US: "United States",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    VA: "Vatican City",
    VC: "Saint Vincent and the Grenadines",
    VE: "Venezuela",
    VG: "British Virgin Islands",
    VI: "United States Virgin Islands",
    VN: "Vietnam",
    VU: "Vanuatu",
    WS: "Samoa",
    XK: "Kosovo",
    YE: "Yemen",
    ZA: "South Africa",
    ZM: "Zambia",
    ZW: "Zimbabwe"
  };

  function graphqlRequest(query, variables) {
    return fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        variables: variables || {}
      })
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            "GraphQL HTTP error " + response.status
          );
        }

        return response.json();
      })
      .then(function (result) {
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }

        return result.data;
      });
  }

  function normalizeValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    var normalized = String(value)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    return normalized || null;
  }

  function buildSearchValue(field, value) {
    if (value === null || value === undefined) {
      return null;
    }

    value = String(value).trim();

    if (!value) {
      return null;
    }

    if (field === "country") {
      return COUNTRY_NAMES[value.toUpperCase()] || value;
    }

    if (field === "eye_color") {
      return "Eyes - " + value;
    }
    
    if (field === "hair_color") {
      return "Hair - " + value;
    }

    return value;
  }

  function getPerformerId() {
    var match = window.location.pathname.match(
      /^\/performers\/(\d+)(?:\/|$)/
    );

    return match ? match[1] : null;
  }

  function loadPerformer(performerId) {
    var query = [
      "query FindPerformer($id: ID!) {",
      "  findPerformer(id: $id) {",
      "    id",
      "    name",
      "    country",
      "    ethnicity",
      "    eye_color",
      "    hair_color",
      "    tags { id name }",
      "  }",
      "}"
    ].join("\n");

    return graphqlRequest(query, {
      id: performerId
    }).then(function (data) {
      return data.findPerformer;
    });
  }

  function loadTags() {
    var query = [
      "query FindTags {",
      "  findTags(filter: { per_page: -1 }) {",
      "    tags {",
      "      id",
      "      name",
      "      aliases",
      "    }",
      "  }",
      "}"
    ].join("\n");

    return graphqlRequest(query, {}).then(function (data) {
      return data.findTags.tags || [];
    });
  }

  function buildTagIndex(tags) {
    var index = {};

    function register(value, tag) {
      var normalized = normalizeValue(value);

      if (normalized && !index[normalized]) {
        index[normalized] = tag;
      }
    }

    for (var i = 0; i < tags.length; i += 1) {
      var tag = tags[i];

      register(tag.name, tag);

      var aliases = tag.aliases || [];

      for (var j = 0; j < aliases.length; j += 1) {
        register(aliases[j], tag);
      }
    }

    return index;
  }

  function calculateTags(performer, tagIndex) {
    var fields = [
      "country",
      "ethnicity",
      "eye_color",
      "hair_color"
    ];

    var existingIds = {};
    var updatedIds = [];
    var addedTags = [];
    var unmatched = [];

    var existingTags = performer.tags || [];

    for (var i = 0; i < existingTags.length; i += 1) {
      var existingId = String(existingTags[i].id);

      existingIds[existingId] = true;
      updatedIds.push(existingId);
    }

    for (var j = 0; j < fields.length; j += 1) {
      var field = fields[j];
      var metadataValue = performer[field];

      if (!metadataValue) {
        continue;
      }

      var searchValue = buildSearchValue(
        field,
        metadataValue
      );

      var matchedTag = tagIndex[
        normalizeValue(searchValue)
      ];

      if (!matchedTag) {
        unmatched.push(searchValue);
        continue;
      }

      var matchedId = String(matchedTag.id);

      if (!existingIds[matchedId]) {
        existingIds[matchedId] = true;
        updatedIds.push(matchedId);
        addedTags.push(matchedTag.name);
      }
    }

    return {
      tagIds: updatedIds,
      addedTags: addedTags,
      unmatched: unmatched
    };
  }

  function updatePerformer(performerId, tagIds) {
    var mutation = [
      "mutation PerformerUpdate($input: PerformerUpdateInput!) {",
      "  performerUpdate(input: $input) {",
      "    id",
      "    name",
      "  }",
      "}"
    ].join("\n");

    return graphqlRequest(mutation, {
      input: {
        id: performerId,
        tag_ids: tagIds
      }
    });
  }

  function showMessage(message, type) {
    var alert = document.createElement("div");

    alert.className =
      "alert alert-" +
      type +
      " performer-metadata-tag-matcher-alert";

    alert.style.position = "fixed";
    alert.style.right = "20px";
    alert.style.bottom = "20px";
    alert.style.zIndex = "10000";
    alert.style.maxWidth = "450px";
    alert.style.whiteSpace = "pre-line";

    alert.textContent = message;

    document.body.appendChild(alert);

    window.setTimeout(function () {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 7000);
  }

  function setButtonState(button, running) {
    button.disabled = running;

    button.textContent = running
      ? "Matching tags..."
      : "Match metadata tags";
  }

  function processCurrentPerformer(button) {
    var performerId = getPerformerId();

    if (!performerId) {
      showMessage(
        "Impossibile determinare l'ID del performer.",
        "danger"
      );

      return;
    }

    setButtonState(button, true);

    Promise.all([
      loadPerformer(performerId),
      loadTags()
    ])
      .then(function (results) {
        var performer = results[0];
        var tags = results[1];

        if (!performer) {
          throw new Error("Performer non trovato.");
        }

        var tagIndex = buildTagIndex(tags);

        var changes = calculateTags(
          performer,
          tagIndex
        );

        if (changes.addedTags.length === 0) {
          var message =
            "Nessun nuovo tag da aggiungere.";

          if (changes.unmatched.length > 0) {
            message +=
              "\n\nValori senza corrispondenza:\n" +
              changes.unmatched.join("\n");
          }

          showMessage(message, "info");
          return null;
        }

        return updatePerformer(
          performerId,
          changes.tagIds
        ).then(function () {
          var message =
            "Tag aggiunti a " +
            performer.name +
            ":\n" +
            changes.addedTags.join("\n");

          if (changes.unmatched.length > 0) {
            message +=
              "\n\nValori senza corrispondenza:\n" +
              changes.unmatched.join("\n");
          }

          showMessage(message, "success");

          /*
           * Ricarica la pagina per mostrare immediatamente
           * i nuovi tag nella scheda.
           */
          window.setTimeout(function () {
            window.location.reload();
          }, 1200);
        });
      })
      .catch(function (error) {
        console.error(
          "[Performer Metadata Tag Matcher]",
          error
        );

        showMessage(
          "Errore durante l'elaborazione:\n" +
          String(error),
          "danger"
        );
      })
      .then(function () {
        setButtonState(button, false);
      });
  }

  function findButtonContainer() {
    var selectors = [
      ".detail-header .btn-group",
      ".performer-card .btn-group",
      ".performer-details .btn-group",
      ".detail-header",
      ".performer-card",
      ".performer-details"
    ];

    for (var i = 0; i < selectors.length; i += 1) {
      var element = document.querySelector(
        selectors[i]
      );

      if (element) {
        return element;
      }
    }

    return null;
  }

  function injectButton() {
    var performerId = getPerformerId();

    if (!performerId) {
      return;
    }

    if (document.getElementById(BUTTON_ID)) {
      return;
    }

    var container = findButtonContainer();

    if (!container) {
      return;
    }

    var button = document.createElement("button");

    button.id = BUTTON_ID;
    button.type = "button";
    button.className = "btn btn-primary";
    button.textContent = "Match metadata tags";
    button.title =
      "Aggiunge i tag corrispondenti ai metadata di questo performer";

    button.addEventListener("click", function () {
      processCurrentPerformer(button);
    });

    container.appendChild(button);
  }

  var scheduled = false;

  function scheduleInjection() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    window.setTimeout(function () {
      scheduled = false;
      injectButton();
    }, OBSERVER_DELAY_MS);
  }

  var observer = new MutationObserver(function () {
    scheduleInjection();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener(
    "popstate",
    scheduleInjection
  );

  document.addEventListener(
    "DOMContentLoaded",
    scheduleInjection
  );

  scheduleInjection();
})();
