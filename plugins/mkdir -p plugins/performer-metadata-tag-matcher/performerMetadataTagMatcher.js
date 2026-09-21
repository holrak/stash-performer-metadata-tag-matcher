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

  var FIND_TAGS_QUERY = `
    query FindTags($page: Int!, $perPage: Int!) {
      findTags(
        filter: {
          page: $page
          per_page: $perPage
          sort: "name"
          direction: ASC
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
          sort: "name"
          direction: ASC
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
      .toLocaleLowerCase();

    return normalized.length > 0 ? normalized : null;
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

    return selectedFields.length > 0
      ? uniqueValues(selectedFields)
      : defaultFields;
  }

  function loadAllTags() {
    var page = 1;
    var allTags = [];
    var total = null;

    while (total === null || allTags.length < total) {
      var result = gql.Do(FIND_TAGS_QUERY, {
        page: page,
        perPage: PAGE_SIZE
      });

      var pageResult = result.findTags;
      var tags = pageResult.tags || [];

      total = pageResult.count;

      for (var i = 0; i < tags.length; i += 1) {
        allTags.push(tags[i]);
      }

      if (tags.length === 0) {
        break;
      }

      page += 1;
    }

    return allTags;
  }

  function buildTagIndex(tags) {
    var index = {};
    var duplicateMatches = {};

    function registerValue(value, tag) {
      var normalized = normalizeValue(value);

      if (!normalized) {
        return;
      }

      if (!index[normalized]) {
        index[normalized] = tag;
        return;
      }

      if (index[normalized].id !== tag.id) {
        if (!duplicateMatches[normalized]) {
          duplicateMatches[normalized] = [
            index[normalized].name
          ];
        }

        duplicateMatches[normalized].push(tag.name);
      }
    }

    for (var i = 0; i < tags.length; i += 1) {
      var tag = tags[i];

      registerValue(tag.name, tag);

      var aliases = tag.aliases || [];

      for (var j = 0; j < aliases.length; j += 1) {
        registerValue(aliases[j], tag);
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

    if (typeof value === "object") {
      if (value.name) {
        return value.name;
      }

      return null;
    }

    return String(value);
  }

  function findExpectedTags(performer, selectedFields, tagIndex) {
    var matchedTags = [];
    var unmatchedValues = [];

    for (var i = 0; i < selectedFields.length; i += 1) {
      var field = selectedFields[i];
      var originalValue = getMetadataValue(performer, field);
      var normalizedValue = normalizeValue(originalValue);

      if (!normalizedValue) {
        continue;
      }

      var matchingTag = tagIndex[normalizedValue];

      if (matchingTag) {
        matchedTags.push({
          field: field,
          metadataValue: originalValue,
          tag: matchingTag
        });
      } else {
        unmatchedValues.push({
          field: field,
          value: originalValue
        });
      }
    }

    return {
      matchedTags: matchedTags,
      unmatchedValues: unmatchedValues
    };
  }

  function calculateUpdatedTagIds(existingTags, matches) {
    var tagIds = [];
    var existingIds = {};

    for (var i = 0; i < existingTags.length; i += 1) {
      var existingId = String(existingTags[i].id);

      existingIds[existingId] = true;
      tagIds.push(existingId);
    }

    var addedTags = [];

    for (var j = 0; j < matches.length; j += 1) {
      var matchedTag = matches[j].tag;
      var matchedId = String(matchedTag.id);

      if (!existingIds[matchedId]) {
        existingIds[matchedId] = true;
        tagIds.push(matchedId);
        addedTags.push(matches[j]);
      }
    }

    return {
      tagIds: tagIds,
      addedTags: addedTags
    };
  }

  function updatePerformer(performerId, tagIds) {
    return gql.Do(UPDATE_PERFORMER_MUTATION, {
      input: {
        id: String(performerId),
        tag_ids: tagIds
      }
    });
  }

  function logDuplicateAliases(duplicateMatches) {
    var keys = Object.keys(duplicateMatches);

    if (keys.length === 0) {
      return;
    }

    log.Warn(
      "Some tag names or aliases match more than one tag. " +
      "The first matching tag will be used."
    );

    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];

      log.Warn(
        'Duplicate match "' +
        key +
        '": ' +
        duplicateMatches[key].join(", ")
      );
    }
  }

  function run() {
    var args = input.Args || input.args || {};
    var mode = args.mode || "preview";
    var preview = mode !== "apply";
    var selectedFields = parseSelectedFields(args);

    log.Info("Performer Metadata Tag Matcher started");
    log.Info("Mode: " + (preview ? "preview" : "apply"));
    log.Info("Fields: " + selectedFields.join(", "));

    var tags = loadAllTags();
    var tagData = buildTagIndex(tags);
    var tagIndex = tagData.index;

    log.Info("Loaded " + tags.length + " existing tags");

    logDuplicateAliases(tagData.duplicateMatches);

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
      var result = gql.Do(FIND_PERFORMERS_QUERY, {
        page: page,
        perPage: PAGE_SIZE
      });

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
            unmatchedIndex < matches.unmatchedValues.length;
            unmatchedIndex += 1
          ) {
            var unmatched = matches.unmatchedValues[unmatchedIndex];
            var unmatchedKey =
              unmatched.field + ":" + normalizeValue(unmatched.value);

            if (!statistics.unmatchedValues[unmatchedKey]) {
              statistics.unmatchedValues[unmatchedKey] = {
                field: unmatched.field,
                value: unmatched.value,
                count: 0
              };
            }

            statistics.unmatchedValues[unmatchedKey].count += 1;
          }

          var update = calculateUpdatedTagIds(
            performer.tags || [],
            matches.matchedTags
          );

          if (update.addedTags.length > 0) {
            statistics.performersChanged += 1;
            statistics.tagAssociationsAdded += update.addedTags.length;

            var additions = [];

            for (
              var additionIndex = 0;
              additionIndex < update.addedTags.length;
              additionIndex += 1
            ) {
              var addition = update.addedTags[additionIndex];

              additions.push(
                FIELD_LABELS[addition.field] +
                ' "' +
                addition.metadataValue +
                '" -> tag "' +
                addition.tag.name +
                '"'
              );
            }

            log.Info(
              (preview ? "[PREVIEW] " : "[UPDATE] ") +
              performer.name +
              ": " +
              additions.join("; ")
            );

            if (!preview) {
              updatePerformer(performer.id, update.tagIds);
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
              statistics.performersAnalyzed / totalPerformers,
              1
            )
          );
        }
      }

      page += 1;
    }

    var unmatchedList = Object.keys(statistics.unmatchedValues)
      .map(function (key) {
        return statistics.unmatchedValues[key];
      })
      .sort(function (a, b) {
        if (a.field !== b.field) {
          return a.field.localeCompare(b.field);
        }

        return String(a.value).localeCompare(String(b.value));
      });

    if (unmatchedList.length > 0) {
      log.Info("Metadata values without a matching tag:");

      for (var unmatchedListIndex = 0;
        unmatchedListIndex < unmatchedList.length;
        unmatchedListIndex += 1
      ) {
        var item = unmatchedList[unmatchedListIndex];

        log.Info(
          "- " +
          FIELD_LABELS[item.field] +
          ': "' +
          item.value +
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
      "Performers analyzed: " + statistics.performersAnalyzed,
      "Performers requiring changes: " + statistics.performersChanged,
      "Tag associations found: " + statistics.tagAssociationsAdded,
      "Unmatched metadata values: " + unmatchedList.length,
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
    log.Error("Fatal error: " + String(error));

    return {
      Error: "Plugin failed: " + String(error)
    };
  }
})();
