(function () {
  "use strict";

  var PAGE_SIZE = 100;

  var FIELD_LABELS = {
    country: "Country",
    ethnicity: "Ethnicity",
    eye_color: "Eye color",
    hair_color: "Hair color",
    gender: "Gender"
  };

  /*
   * Carichiamo tutti i tag in una sola volta.
   *
   * Questa query evita sort e direction, che possono creare
   * incompatibilità tra differenti versioni di Stash.
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

  /*
   * Converte il contenuto del metadata nel nome da cercare.
   *
   * Green + eye_color  -> Green Eyes
   * Brown + hair_color -> Brown Hair
   *
   * Gli altri metadata rimangono invariati.
   */
  function buildSearchValue(field, metadataValue) {
    if (
      metadataValue === null ||
      metadataValue === undefined
    ) {
      return null;
    }

    var value = String(metadataValue).trim();

    if (!value) {
      return null;
    }

    if (field === "eye_color") {
      return value + " Eyes";
    }

    if (field === "hair_color") {
      return value + " Hair";
    }

    return value;
  }

  function uniqueValues(values) {
    var seen = {};
    var output = [];

    for (var i = 0; i < values.length; i += 1) {
      var value = values[i];

      if (!seen[value]) {
        seen[value] = true;
        output.push(value);
      }
    }

    return output;
  }

  function parseSelectedFields(args) {
    var defaultFields = [
      "country",
      "ethnicity",
      "eye_color",
      "hair_color"
    ];

    if (!args || !args.fields) {
      return defaultFields;
    }

    var requestedFields = String(args.fields).split(",");
    var selectedFields = [];

    for (var i = 0; i < requestedFields.length; i += 1) {
      var field = requestedFields[i].trim();

      if (FIELD_LABELS[field]) {
        selectedFields.push(field);
      }
    }

    if (selectedFields.length === 0) {
      return defaultFields;
    }

    return uniqueValues(selectedFields);
  }

  function loadAllTags() {
    log.Info("Loading existing tags...");

    var result = gql.Do(FIND_TAGS_QUERY, {});

    if (!result) {
      throw new Error(
        "The findTags query returned an empty result."
      );
    }

    if (!result.findTags) {
      throw new Error(
        "The GraphQL response does not contain findTags."
      );
    }

    var tags = result.findTags.tags || [];

    log.Info(
      "Loaded " +
      tags.length +
      " existing tags from Stash."
    );

    return tags;
  }

  /*
   * Crea un indice che comprende:
   *
   * nome del tag -> tag
   * alias del tag -> tag
   */
  function buildTagIndex(tags) {
    var index = {};
    var duplicateMatches = {};

    function registerValue(value, tag, source) {
      var normalized = normalizeValue(value);

      if (!normalized) {
        return;
      }

      if (!index[normalized]) {
        index[normalized] = {
          tag: tag,
          source: source,
          matchedText: value
        };

        return;
      }

      if (String(index[normalized].tag.id) !== String(tag.id)) {
        if (!duplicateMatches[normalized]) {
          duplicateMatches[normalized] = [
            index[normalized].tag.name
          ];
        }

        duplicateMatches[normalized].push(tag.name);
      }
    }

    for (var i = 0; i < tags.length; i += 1) {
      var tag = tags[i];

      registerValue(tag.name, tag, "name");

      var aliases = tag.aliases || [];

      for (var j = 0; j < aliases.length; j += 1) {
        registerValue(aliases[j], tag, "alias");
      }
    }

    return {
      index: index,
      duplicateMatches: duplicateMatches
    };
  }

  function getMetadataValue(performer, field) {
    var value = performer[field];

    if (value === null || value === undefined) {
      return null;
    }

    /*
     * Compatibilità con eventuali campi GraphQL
     * restituiti come oggetto.
     */
    if (typeof value === "object") {
      if (value.name) {
        return String(value.name);
      }

      return null;
    }

    return String(value);
  }

  function findExpectedTags(
    performer,
    selectedFields,
    tagIndex
  ) {
    var matchedTags = [];
    var unmatchedValues = [];

    for (var i = 0; i < selectedFields.length; i += 1) {
      var field = selectedFields[i];

      var metadataValue = getMetadataValue(
        performer,
        field
      );

      if (!metadataValue) {
        continue;
      }

      /*
       * Applichiamo la trasformazione richiesta:
       *
       * eye_color Green  -> Green Eyes
       * hair_color Brown -> Brown Hair
       */
      var searchValue = buildSearchValue(
        field,
        metadataValue
      );

      var normalizedSearchValue = normalizeValue(
        searchValue
      );

      if (!normalizedSearchValue) {
        continue;
      }

      var matchingEntry = tagIndex[
        normalizedSearchValue
      ];

      if (matchingEntry) {
        matchedTags.push({
          field: field,
          metadataValue: metadataValue,
          searchValue: searchValue,
          tag: matchingEntry.tag,
          matchSource: matchingEntry.source,
          matchedText: matchingEntry.matchedText
        });
      } else {
        unmatchedValues.push({
          field: field,
          metadataValue: metadataValue,
          searchValue: searchValue
        });
      }
    }

    return {
      matchedTags: matchedTags,
      unmatchedValues: unmatchedValues
    };
  }

  /*
   * Mantiene tutti i tag esistenti e aggiunge
   * esclusivamente quelli mancanti.
   */
  function calculateUpdatedTagIds(
    existingTags,
    matchedTags
  ) {
    var tagIds = [];
    var existingIds = {};
    var addedTags = [];

    for (var i = 0; i < existingTags.length; i += 1) {
      var existingId = String(existingTags[i].id);

      if (!existingIds[existingId]) {
        existingIds[existingId] = true;
        tagIds.push(existingId);
      }
    }

    for (var j = 0; j < matchedTags.length; j += 1) {
      var matchedTagId = String(
        matchedTags[j].tag.id
      );

      if (!existingIds[matchedTagId]) {
        existingIds[matchedTagId] = true;
        tagIds.push(matchedTagId);
        addedTags.push(matchedTags[j]);
      }
    }

    return {
      tagIds: tagIds,
      addedTags: addedTags
    };
  }

  function updatePerformer(performerId, tagIds) {
    return gql.Do(
      UPDATE_PERFORMER_MUTATION,
      {
        input: {
          id: String(performerId),
          tag_ids: tagIds
        }
      }
    );
  }

  function logDuplicateMatches(duplicateMatches) {
    var keys = Object.keys(duplicateMatches);

    if (keys.length === 0) {
      return;
    }

    log.Warn(
      "Some tag names or aliases correspond to multiple tags."
    );

    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];

      log.Warn(
        'Duplicate value "' +
        key +
        '": ' +
        duplicateMatches[key].join(", ")
      );
    }
  }

  function registerUnmatchedValue(
    statistics,
    unmatched
  ) {
    var key =
      unmatched.field +
      ":" +
      normalizeValue(unmatched.searchValue);

    if (!statistics.unmatchedValues[key]) {
      statistics.unmatchedValues[key] = {
        field: unmatched.field,
        metadataValue: unmatched.metadataValue,
        searchValue: unmatched.searchValue,
        count: 0
      };
    }

    statistics.unmatchedValues[key].count += 1;
  }

  function run() {
    var args = input.Args || input.args || {};
    var mode = args.mode || "preview";
    var preview = mode !== "apply";

    var selectedFields = parseSelectedFields(args);

    log.Info("Performer Metadata Tag Matcher started.");
    log.Info(
      "Mode: " +
      (preview ? "preview" : "apply")
    );
    log.Info(
      "Selected fields: " +
      selectedFields.join(", ")
    );

    var tags = loadAllTags();
    var tagData = buildTagIndex(tags);
    var tagIndex = tagData.index;

    log.Info(
      "Searchable tag names and aliases: " +
      Object.keys(tagIndex).length
    );

    logDuplicateMatches(
      tagData.duplicateMatches
    );

    var statistics = {
      performersAnalyzed: 0,
      performersChanged: 0,
      tagAssociationsAdded: 0,
      unmatchedValues: {},
      errors: 0
    };

    var page = 1;
    var totalPerformers = null;

    while (
      totalPerformers === null ||
      statistics.performersAnalyzed < totalPerformers
    ) {
      var result = gql.Do(
        FIND_PERFORMERS_QUERY,
        {
          page: page,
          perPage: PAGE_SIZE
        }
      );

      if (!result || !result.findPerformers) {
        throw new Error(
          "The GraphQL response does not contain findPerformers."
        );
      }

      var pageResult = result.findPerformers;
      var performers = pageResult.performers || [];

      totalPerformers = pageResult.count;

      if (performers.length === 0) {
        break;
      }

      for (var i = 0; i < performers.length; i += 1) {
        var performer = performers[i];

        try {
          var matches = findExpectedTags(
            performer,
            selectedFields,
            tagIndex
          );

          for (
            var unmatchedIndex = 0;
            unmatchedIndex <
              matches.unmatchedValues.length;
            unmatchedIndex += 1
          ) {
            registerUnmatchedValue(
              statistics,
              matches.unmatchedValues[
                unmatchedIndex
              ]
            );
          }

          var update = calculateUpdatedTagIds(
            performer.tags || [],
            matches.matchedTags
          );

          if (update.addedTags.length > 0) {
            statistics.performersChanged += 1;
            statistics.tagAssociationsAdded +=
              update.addedTags.length;

            var additions = [];

            for (
              var additionIndex = 0;
              additionIndex < update.addedTags.length;
              additionIndex += 1
            ) {
              var addition =
                update.addedTags[additionIndex];

              additions.push(
                FIELD_LABELS[addition.field] +
                ' "' +
                addition.metadataValue +
                '" searched as "' +
                addition.searchValue +
                '" -> tag "' +
                addition.tag.name +
                '" matched by ' +
                addition.matchSource
              );
            }

            log.Info(
              (preview ? "[PREVIEW] " : "[UPDATE] ") +
              performer.name +
              ": " +
              additions.join("; ")
            );

            if (!preview) {
              updatePerformer(
                performer.id,
                update.tagIds
              );
            }
          }
        } catch (error) {
          statistics.errors += 1;

          log.Error(
            "Unable to process performer " +
            performer.id +
            " (" +
            performer.name +
            "): " +
            String(error)
          );
        }

        statistics.performersAnalyzed += 1;

        if (totalPerformers > 0) {
          log.Progress(
            Math.min(
              statistics.performersAnalyzed /
                totalPerformers,
              1
            )
          );
        }
      }

      page += 1;
    }

    var unmatchedList = Object.keys(
      statistics.unmatchedValues
    ).map(function (key) {
      return statistics.unmatchedValues[key];
    });

    unmatchedList.sort(function (a, b) {
      if (a.field !== b.field) {
        return a.field.localeCompare(b.field);
      }

      return String(a.searchValue).localeCompare(
        String(b.searchValue)
      );
    });

    if (unmatchedList.length > 0) {
      log.Info(
        "Metadata values without a matching tag:"
      );

      for (
        var unmatchedListIndex = 0;
        unmatchedListIndex < unmatchedList.length;
        unmatchedListIndex += 1
      ) {
        var item =
          unmatchedList[unmatchedListIndex];

        log.Info(
          "- " +
          FIELD_LABELS[item.field] +
          ': metadata "' +
          item.metadataValue +
          '", searched tag "' +
          item.searchValue +
          '" (' +
          item.count +
          " performers)"
        );
      }
    }

    log.Progress(1);

    var summary = [
      "Performer Metadata Tag Matcher completed.",
      "Mode: " + (preview ? "preview" : "apply"),
      "Performers analyzed: " +
        statistics.performersAnalyzed,
      "Performers requiring changes: " +
        statistics.performersChanged,
      "Tag associations added or planned: " +
        statistics.tagAssociationsAdded,
      "Unmatched metadata values: " +
        unmatchedList.length,
      "Errors: " + statistics.errors
    ].join("\n");

    log.Info(summary);

    return {
      Output: summary
    };
  }

  try {
    return run();
  } catch (error) {
    var errorMessage = String(error);

    log.Error(
      "Performer Metadata Tag Matcher fatal error: " +
      errorMessage
    );

    return {
      Error:
        "Performer Metadata Tag Matcher failed: " +
        errorMessage
    };
  }
})();
