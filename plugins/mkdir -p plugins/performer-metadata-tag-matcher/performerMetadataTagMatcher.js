(function () {
  "use strict";

  var PAGE_SIZE = 100;
  var UPDATE_DELAY_MS = 250;

  var COUNTRY_NAMES = {
    AD:"Andorra",AE:"United Arab Emirates",AF:"Afghanistan",AG:"Antigua and Barbuda",AI:"Anguilla",AL:"Albania",AM:"Armenia",AO:"Angola",AQ:"Antarctica",AR:"Argentina",AS:"American Samoa",AT:"Austria",AU:"Australia",AW:"Aruba",AX:"Aland Islands",AZ:"Azerbaijan",
    BA:"Bosnia and Herzegovina",BB:"Barbados",BD:"Bangladesh",BE:"Belgium",BF:"Burkina Faso",BG:"Bulgaria",BH:"Bahrain",BI:"Burundi",BJ:"Benin",BL:"Saint Barthelemy",BM:"Bermuda",BN:"Brunei",BO:"Bolivia",BQ:"Bonaire, Sint Eustatius and Saba",BR:"Brazil",BS:"Bahamas",BT:"Bhutan",BV:"Bouvet Island",BW:"Botswana",BY:"Belarus",BZ:"Belize",
    CA:"Canada",CC:"Cocos Islands",CD:"Democratic Republic of the Congo",CF:"Central African Republic",CG:"Congo",CH:"Switzerland",CI:"Ivory Coast",CK:"Cook Islands",CL:"Chile",CM:"Cameroon",CN:"China",CO:"Colombia",CR:"Costa Rica",CU:"Cuba",CV:"Cape Verde",CW:"Curacao",CX:"Christmas Island",CY:"Cyprus",CZ:"Czechia",
    DE:"Germany",DJ:"Djibouti",DK:"Denmark",DM:"Dominica",DO:"Dominican Republic",DZ:"Algeria",
    EC:"Ecuador",EE:"Estonia",EG:"Egypt",EH:"Western Sahara",ER:"Eritrea",ES:"Spain",ET:"Ethiopia",
    FI:"Finland",FJ:"Fiji",FK:"Falkland Islands",FM:"Micronesia",FO:"Faroe Islands",FR:"France",
    GA:"Gabon",GB:"United Kingdom",GD:"Grenada",GE:"Georgia",GF:"French Guiana",GG:"Guernsey",GH:"Ghana",GI:"Gibraltar",GL:"Greenland",GM:"Gambia",GN:"Guinea",GP:"Guadeloupe",GQ:"Equatorial Guinea",GR:"Greece",GS:"South Georgia and the South Sandwich Islands",GT:"Guatemala",GU:"Guam",GW:"Guinea-Bissau",GY:"Guyana",
    HK:"Hong Kong",HM:"Heard Island and McDonald Islands",HN:"Honduras",HR:"Croatia",HT:"Haiti",HU:"Hungary",
    ID:"Indonesia",IE:"Ireland",IL:"Israel",IM:"Isle of Man",IN:"India",IO:"British Indian Ocean Territory",IQ:"Iraq",IR:"Iran",IS:"Iceland",IT:"Italy",
    JE:"Jersey",JM:"Jamaica",JO:"Jordan",JP:"Japan",
    KE:"Kenya",KG:"Kyrgyzstan",KH:"Cambodia",KI:"Kiribati",KM:"Comoros",KN:"Saint Kitts and Nevis",KP:"North Korea",KR:"South Korea",KW:"Kuwait",KY:"Cayman Islands",KZ:"Kazakhstan",
    LA:"Laos",LB:"Lebanon",LC:"Saint Lucia",LI:"Liechtenstein",LK:"Sri Lanka",LR:"Liberia",LS:"Lesotho",LT:"Lithuania",LU:"Luxembourg",LV:"Latvia",LY:"Libya",
    MA:"Morocco",MC:"Monaco",MD:"Moldova",ME:"Montenegro",MF:"Saint Martin",MG:"Madagascar",MH:"Marshall Islands",MK:"North Macedonia",ML:"Mali",MM:"Myanmar",MN:"Mongolia",MO:"Macao",MP:"Northern Mariana Islands",MQ:"Martinique",MR:"Mauritania",MS:"Montserrat",MT:"Malta",MU:"Mauritius",MV:"Maldives",MW:"Malawi",MX:"Mexico",MY:"Malaysia",MZ:"Mozambique",
    NA:"Namibia",NC:"New Caledonia",NE:"Niger",NF:"Norfolk Island",NG:"Nigeria",NI:"Nicaragua",NL:"Netherlands",NO:"Norway",NP:"Nepal",NR:"Nauru",NU:"Niue",NZ:"New Zealand",
    OM:"Oman",PA:"Panama",PE:"Peru",PF:"French Polynesia",PG:"Papua New Guinea",PH:"Philippines",PK:"Pakistan",PL:"Poland",PM:"Saint Pierre and Miquelon",PN:"Pitcairn",PR:"Puerto Rico",PS:"Palestine",PT:"Portugal",PW:"Palau",PY:"Paraguay",QA:"Qatar",
    RE:"Reunion",RO:"Romania",RS:"Serbia",RU:"Russia",RW:"Rwanda",
    SA:"Saudi Arabia",SB:"Solomon Islands",SC:"Seychelles",SD:"Sudan",SE:"Sweden",SG:"Singapore",SH:"Saint Helena",SI:"Slovenia",SJ:"Svalbard and Jan Mayen",SK:"Slovakia",SL:"Sierra Leone",SM:"San Marino",SN:"Senegal",SO:"Somalia",SR:"Suriname",SS:"South Sudan",ST:"Sao Tome and Principe",SV:"El Salvador",SX:"Sint Maarten",SY:"Syria",SZ:"Eswatini",
    TC:"Turks and Caicos Islands",TD:"Chad",TF:"French Southern Territories",TG:"Togo",TH:"Thailand",TJ:"Tajikistan",TK:"Tokelau",TL:"Timor-Leste",TM:"Turkmenistan",TN:"Tunisia",TO:"Tonga",TR:"Turkey",TT:"Trinidad and Tobago",TV:"Tuvalu",TW:"Taiwan",TZ:"Tanzania",
    UA:"Ukraine",UG:"Uganda",UM:"United States Minor Outlying Islands",US:"United States",UY:"Uruguay",UZ:"Uzbekistan",
    VA:"Vatican City",VC:"Saint Vincent and the Grenadines",VE:"Venezuela",VG:"British Virgin Islands",VI:"United States Virgin Islands",VN:"Vietnam",VU:"Vanuatu",
    WF:"Wallis and Futuna",WS:"Samoa",XK:"Kosovo",YE:"Yemen",YT:"Mayotte",ZA:"South Africa",ZM:"Zambia",ZW:"Zimbabwe"
  };

  var FIELD_LABELS = {
    country: "Country",
    ethnicity: "Ethnicity",
    eye_color: "Eye color",
    hair_color: "Hair color",
    gender: "Gender"
  };

  var FIND_TAGS_QUERY = [
    "query FindTags {",
    "  findTags(filter: { per_page: -1 }) {",
    "    count",
    "    tags { id name aliases }",
    "  }",
    "}"
  ].join("\n");

  var FIND_PERFORMERS_QUERY = [
    "query FindPerformers($page: Int!, $perPage: Int!) {",
    "  findPerformers(filter: { page: $page, per_page: $perPage }) {",
    "    count",
    "    performers {",
    "      id name country ethnicity eye_color hair_color gender",
    "      tags { id name }",
    "    }",
    "  }",
    "}"
  ].join("\n");

  var UPDATE_PERFORMER_MUTATION = [
    "mutation PerformerUpdate($input: PerformerUpdateInput!) {",
    "  performerUpdate(input: $input) { id name }",
    "}"
  ].join("\n");

  function normalizeValue(value) {
    if (value === null || value === undefined) return null;
    var normalized = String(value).trim().replace(/\\s+/g, " ").toLowerCase();
    return normalized.length ? normalized : null;
  }

  function uniqueFields(values) {
    var seen = {};
    var result = [];
    for (var i = 0; i < values.length; i += 1) {
      var value = String(values[i]).trim();
      if (FIELD_LABELS[value] && !seen[value]) {
        seen[value] = true;
        result.push(value);
      }
    }
    return result;
  }

  function parseSelectedFields(args) {
    var defaults = ["country", "ethnicity", "eye_color", "hair_color"];
    if (!args || !args.fields) return defaults;
    var selected = uniqueFields(String(args.fields).split(","));
    return selected.length ? selected : defaults;
  }

  function buildSearchValue(field, metadataValue) {
    if (metadataValue === null || metadataValue === undefined) return null;
    var value = String(metadataValue).trim();
    if (!value) return null;

    if (field === "country") {
      var code = value.toUpperCase();
      return COUNTRY_NAMES[code] || value;
    }
    if (field === "eye_color") {
      return "Eyes - " + value;
    }  
    if (field === "hair_color") {
      return "Hair - " + value;
    }
    return value;
    }

  function loadAllTags() {
    log.Info("Loading existing tags...");
    var response = gql.Do(FIND_TAGS_QUERY, {});
    if (!response || !response.findTags) {
      throw new Error("findTags returned no usable data");
    }
    var tags = response.findTags.tags || [];
    log.Info("Loaded " + tags.length + " existing tags.");
    return tags;
  }

  function buildTagIndex(tags) {
    var index = {};
    var duplicates = {};

    function register(value, tag, source) {
      var key = normalizeValue(value);
      if (!key) return;

      if (!index[key]) {
        index[key] = { tag: tag, source: source, matchedText: String(value) };
        return;
      }

      if (String(index[key].tag.id) !== String(tag.id)) {
        if (!duplicates[key]) duplicates[key] = [index[key].tag.name];
        if (duplicates[key].indexOf(tag.name) === -1) duplicates[key].push(tag.name);
      }
    }

    for (var i = 0; i < tags.length; i += 1) {
      var tag = tags[i];
      register(tag.name, tag, "name");
      var aliases = tag.aliases || [];
      for (var j = 0; j < aliases.length; j += 1) {
        register(aliases[j], tag, "alias");
      }
    }

    return { index: index, duplicates: duplicates };
  }

  function logDuplicates(duplicates) {
    var keys = Object.keys(duplicates);
    if (!keys.length) return;
    log.Warn("Duplicate tag names or aliases found. The first loaded tag will be used.");
    for (var i = 0; i < keys.length; i += 1) {
      log.Warn('Duplicate value "' + keys[i] + '": ' + duplicates[keys[i]].join(", "));
    }
  }

  function getMetadataValue(performer, field) {
    var value = performer[field];
    if (value === null || value === undefined) return null;
    if (typeof value === "object") return value.name ? String(value.name) : null;
    return String(value);
  }

  function findMatches(performer, selectedFields, tagIndex) {
    var matches = [];
    var unmatched = [];

    for (var i = 0; i < selectedFields.length; i += 1) {
      var field = selectedFields[i];
      var metadataValue = getMetadataValue(performer, field);
      if (!metadataValue) continue;

      var searchValue = buildSearchValue(field, metadataValue);
      var key = normalizeValue(searchValue);
      if (!key) continue;

      var entry = tagIndex[key];
      if (entry) {
        matches.push({
          field: field,
          metadataValue: metadataValue,
          searchValue: searchValue,
          tag: entry.tag,
          matchSource: entry.source
        });
      } else {
        unmatched.push({
          field: field,
          metadataValue: metadataValue,
          searchValue: searchValue
        });
      }
    }

    return { matches: matches, unmatched: unmatched };
  }

  function calculateUpdate(existingTags, matches) {
    var tagIds = [];
    var knownIds = {};
    var added = [];

    for (var i = 0; i < existingTags.length; i += 1) {
      var existingId = String(existingTags[i].id);
      if (!knownIds[existingId]) {
        knownIds[existingId] = true;
        tagIds.push(existingId);
      }
    }

    for (var j = 0; j < matches.length; j += 1) {
      var tagId = String(matches[j].tag.id);
      if (!knownIds[tagId]) {
        knownIds[tagId] = true;
        tagIds.push(tagId);
        added.push(matches[j]);
      }
    }

    return { tagIds: tagIds, added: added };
  }

  function updatePerformer(performerId, tagIds) {
    var response = gql.Do(UPDATE_PERFORMER_MUTATION, {
      input: { id: String(performerId), tag_ids: tagIds }
    });
    if (!response || !response.performerUpdate) {
      throw new Error("performerUpdate returned no data for performer " + performerId);
    }
  }

  function registerUnmatched(stats, item) {
    var key = item.field + ":" + normalizeValue(item.searchValue);
    if (!stats.unmatched[key]) {
      stats.unmatched[key] = {
        field: item.field,
        metadataValue: item.metadataValue,
        searchValue: item.searchValue,
        count: 0
      };
    }
    stats.unmatched[key].count += 1;
  }

  function formatMatch(match) {
    return FIELD_LABELS[match.field] +
      ' "' + match.metadataValue +
      '" searched as "' + match.searchValue +
      '" -> tag "' + match.tag.name +
      '" matched by ' + match.matchSource;
  }

  function run() {
    var args = input.Args || input.args || {};
    var preview = (args.mode || "preview") !== "apply";
    var selectedFields = parseSelectedFields(args);

    log.Info("Performer Metadata Tag Matcher started.");
    log.Info("Mode: " + (preview ? "preview" : "apply"));
    log.Info("Selected fields: " + selectedFields.join(", "));

    var tagData = buildTagIndex(loadAllTags());
    log.Info("Searchable tag names and aliases: " + Object.keys(tagData.index).length);
    logDuplicates(tagData.duplicates);

    var stats = {
      analyzed: 0,
      changed: 0,
      associations: 0,
      unmatched: {},
      errors: 0
    };

    var page = 1;
    var total = null;

    while (total === null || stats.analyzed < total) {
      var response = gql.Do(FIND_PERFORMERS_QUERY, {
        page: page,
        perPage: PAGE_SIZE
      });

      if (!response || !response.findPerformers) {
        throw new Error("findPerformers returned no usable data");
      }

      var result = response.findPerformers;
      var performers = result.performers || [];
      total = result.count || 0;
      if (!performers.length) break;

      for (var i = 0; i < performers.length; i += 1) {
        var performer = performers[i];

        try {
          var found = findMatches(performer, selectedFields, tagData.index);

          for (var u = 0; u < found.unmatched.length; u += 1) {
            registerUnmatched(stats, found.unmatched[u]);
          }

          var update = calculateUpdate(performer.tags || [], found.matches);

          if (update.added.length) {
            stats.changed += 1;
            stats.associations += update.added.length;

            var descriptions = [];
            for (var a = 0; a < update.added.length; a += 1) {
              descriptions.push(formatMatch(update.added[a]));
            }

            log.Info((preview ? "[PREVIEW] " : "[UPDATE] ") +
              performer.name + ": " + descriptions.join("; "));

            if (!preview) {
              updatePerformer(performer.id, update.tagIds);
              if (UPDATE_DELAY_MS > 0) util.Sleep(UPDATE_DELAY_MS);
            }
          }
        } catch (error) {
          stats.errors += 1;
          log.Error("Unable to process performer " + performer.id +
            " (" + performer.name + "): " + String(error));
        }

        stats.analyzed += 1;
        if (total > 0) log.Progress(Math.min(stats.analyzed / total, 1));
      }

      page += 1;
    }

    var unmatchedKeys = Object.keys(stats.unmatched);
    unmatchedKeys.sort();

    if (unmatchedKeys.length) {
      log.Info("Metadata values without a matching tag:");
      for (var k = 0; k < unmatchedKeys.length; k += 1) {
        var item = stats.unmatched[unmatchedKeys[k]];
        log.Info("- " + FIELD_LABELS[item.field] +
          ': metadata "' + item.metadataValue +
          '", searched tag "' + item.searchValue +
          '" (' + item.count + " performers)");
      }
    }

    log.Progress(1);

    var summary = [
      "Performer Metadata Tag Matcher completed.",
      "Mode: " + (preview ? "preview" : "apply"),
      "Performers analyzed: " + stats.analyzed,
      "Performers requiring changes: " + stats.changed,
      "Tag associations added or planned: " + stats.associations,
      "Unmatched metadata values: " + unmatchedKeys.length,
      "Errors: " + stats.errors
    ].join("\n");

    log.Info(summary);
    return { Output: summary };
  }

  try {
    return run();
  } catch (error) {
    var message = String(error);
    log.Error("Performer Metadata Tag Matcher fatal error: " + message);
    return { Error: "Performer Metadata Tag Matcher failed: " + message };
  }
})();
