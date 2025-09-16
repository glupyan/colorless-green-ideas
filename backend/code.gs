const SENTENCES_SHEET_NAME = "Sentences";
const RATINGS_SHEET_NAME = "Ratings";

function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getResults') {
    return getResults();
  }
  return getSentencesForRating();
}

function getSentencesForRating() {
  try {
    const sheet = getSheet(SENTENCES_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${SENTENCES_SHEET_NAME}" not found.`);
    // Assumes Sentences are in Column D
    const sentences = sheet.getRange("D2:D").getValues().flat().filter(String); 
    return ContentService.createTextOutput(JSON.stringify({ sentences: sentences })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
   }
}

function getResults() {
  try {
    // 1. Get all sentence data (including user_type)
    const sentencesSheet = getSheet(SENTENCES_SHEET_NAME);
    const sentenceData = sentencesSheet.getRange("B2:D" + sentencesSheet.getLastRow()).getValues(); // Get UserID, UserType, Sentence
    const sentenceInfo = {}; // Map sentence text to its user_type
    sentenceData.forEach(row => {
      const userType = row[1]; // Column C is UserType
      const sentence = row[2]; // Column D is Sentence
      if (sentence) {
        sentenceInfo[sentence] = userType;
      }
    });

    // 2. Get and process ratings
    const ratingsSheet = getSheet(RATINGS_SHEET_NAME);
    if (!ratingsSheet || ratingsSheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify([]));

    const ratingsData = ratingsSheet.getRange("C2:E" + ratingsSheet.getLastRow()).getValues(); // Get Sentence, Meaningfulness, Source
    const stats = {};

    ratingsData.forEach(row => {
      const sentence = row[0];
      const meaningfulnessRating = row[1];
      const sourceRating = row[2];

      if (!stats[sentence]) {
        stats[sentence] = { 
          meaningfulness_sum: 0, 
          source_sum: 0,
          count: 0 
        };
      }
      stats[sentence].meaningfulness_sum += meaningfulnessRating;
      stats[sentence].source_sum += sourceRating;
      stats[sentence].count++;
    });

    // 3. Combine data and sort by meaningfulness
    const results = Object.keys(stats).map(sentence => ({
      sentence: sentence,
      meaningfulness_average: stats[sentence].meaningfulness_sum / stats[sentence].count,
      source_average: stats[sentence].source_sum / stats[sentence].count,
      count: stats[sentence].count,
      user_type: sentenceInfo[sentence] || 'other' // Attach the user_type
    }));
    results.sort((a, b) => b.meaningfulness_average - a.average);

    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ error: error.message, stack: error.stack })).setMimeType(ContentService.MimeType.JSON);
   }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'submission') {
      const sheet = getSheet(SENTENCES_SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        // Now includes UserType
        sheet.appendRow(["Timestamp", "UserID", "UserType", "Sentence"]); 
      }
      // Add "human" as the user_type for web submissions
      sheet.appendRow([new Date(), data.userId, "human", data.sentence]); 
      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "submission" }));

    } else if (data.type === 'rating') {
      const sheet = getSheet(RATINGS_SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        // Add the new SourceRating column header
        sheet.appendRow(["Timestamp", "UserID", "Sentence", "MeaningfulnessRating", "SourceRating"]);
      }
      sheet.appendRow([
          new Date(), 
          data.userId, 
          data.sentence, 
          data.meaningfulness_rating, 
          data.source_rating
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", type: "rating" }));
    } else {
      throw new Error("Invalid 'type' in request body.");
    }
  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message })).setMimeType(ContentService.MimeType.JSON);
   }
}