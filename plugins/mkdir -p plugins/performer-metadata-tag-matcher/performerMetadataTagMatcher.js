(function () {
  "use strict";

  /*
   * Performer Metadata Tag Matcher
   *
   * Funzioni:
   * - legge i metadata dei performer;
   * - converte i codici paese ISO alpha-2 in nomi inglesi;
   * - cerca esclusivamente tag già esistenti;
   * - cerca sia nel nome sia negli alias dei tag;
   * - converte Green in Green Eyes per eye_color;
   * - converte Brown in Brown Hair per hair_color;
   * - mantiene tutti i tag già assegnati;
   * - non crea, elimina o sostituisce alcun tag;
   * - supporta anteprima ed elaborazione batch.
   */

  var PAGE_SIZE = 100;

  /*
   * Pausa tra gli aggiornamenti.
   *
   * Riduce il carico sugli hook attivati da performerUpdate,
   * per esempio eventuali plugin di sincronizzazione.
   *
   * Imposta 0 per disattivarla.
   */
  var UPDATE_DELAY_MS = 250;

  /*
   * Conversione ISO 3166-1 alpha-2 in nome inglese.
   *
   * Se il nome utilizzato dai tuoi tag è diverso, aggiungi
   * questo nome inglese come alias del tag.
   *
   * Esempi:
   * IT -> Italy
   * US -> United States
   * VE -> Venezuela
   */
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
    GS: "South Georgia and the South Sandwich Islands",
    GT: "Guatemala",
    GU: "Guam",
    GW: "Guinea-Bissau",
    GY: "Guyana",

    HK: "Hong Kong",
    HM: "Heard Island and McDonald Islands",
    HN: "Honduras",
    HR: "Croatia",
    HT: "Haiti",
    HU: "Hungary",

    ID: "Indonesia",
    IE: "Ireland",
    IL: "Israel",
    IM: "Isle of Man",
    IN: "India",
    IO: "British Indian Ocean Territory",
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
    PN: "Pitcairn",
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
    SJ: "Svalbard and Jan Mayen",
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
    TF: "French Southern Territories",
    TG: "Togo",
    TH: "Thailand",
    TJ: "Tajikistan",
    TK: "Tokelau",
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
    UM: "United States Minor Outlying Islands",
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

    WF: "Wallis and Futuna",
    WS: "Samoa",

    /*
     * XK non è un codice ISO ufficialmente assegnato,
     * ma viene frequentemente utilizzato per il Kosovo.
     */
    XK: "Kosovo",

    YE: "Yemen",
    YT: "Mayotte",

    ZA: "South Africa",
    ZM: "Zambia",
    ZW: "Zimbabwe"
  };

  var FIELD_LABELS = {
    country: "Country",
    ethnicity: "Ethnicity",
    eye_color: "Eye color",
    hair_color: "Hair color",
    gender: "Gender"
  };

  /*
   * Carica tutti i tag esistenti.
   *
   * per_page: -1 evita di dover paginare i tag.
   * Non vengono utilizzati sort o direction per una maggiore
   * compatibilità tra versioni di Stash.
   */
  var FIND_TAGS_QUERY = `
    query FindTags {
      findTags(
        filter: {
          per_page: -1
        }
      ) {
        count
        tags {
          id
          name
          aliases
        }
      }
    }
  `;

  /*
   * Carica i performer in pagine da 100 elementi.
   */
  var FIND_PERFORMERS_QUERY = `
    query FindPerformers($page: Int!, $perPage: Int!) {
      findPerformers(
        filter: {
          page: $page
          per_page: $perPage
        }
      ) {
        count
        performers {
          id
          name
          country
          ethnicity
          eye_color
          hair_color
          gender
          tags {
            id
            name
          }
        }
      }
    }
  `;

  /*
   * Aggiorna soltanto l'elenco dei tag del performer.
   *
   * Prima della mutation vengono mantenuti tutti gli ID
   * dei tag già presenti.
   */
  var UPDATE_PERFORMER_MUTATION = `
    mutation PerformerUpdate($input: PerformerUpdateInput!) {
      performerUpdate(input: $input) {
        id
        name
      }
    }
  `;

  function normalizeValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    var normalized = String(value)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    return normalized.length > 0 ? normalized : null;
  }

  function uniqueStrings(values) {
    var seen = {};
    var output = [];

    for (var i = 0; i < values.length; i += 1) {
      var value = values[i];
      var key = normalizeValue(value);

      if (key && !seen[key]) {
        seen[key] = true;
        output.push(value);
      }
    }

    return output;
  }

  /*
   * Converte il valore del metadata nel testo da cercare.
   *
   * Esempi:
   * country IT       -> Italy
   * country US       -> United States
   * eye_color Green  -> Green Eyes
   * hair_color Brown -> Brown Hair
   * ethnicity Asian  -> Asian
   */
  function buildSearchValue(field, metadataValue) {
    if (
      metadataValue === null ||
      metadataValue === undefined
    ) {
      return null;
    }

    var value = String(metadataValue).trim(
