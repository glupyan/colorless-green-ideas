const SENTENCES_SHEET_NAME = "Sentences";
const RATINGS_SHEET_NAME = "Ratings";

function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

/**
 * Routes GET requests based on an 'action' parameter.
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getResults') {
    return getResults();
  }
  // Default action is to get sentences for rating
  return getSentencesForRating();
}

/**
 * Fetches sentences for the rating view.
 */
function getSentencesForRating() {
  try {
    const sheet = getSheet(SENTENCES_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${SENTENCES_SHEET_NAME}" not found.`);
    const sentences = sheet.getRange("C2:C").getValues().flat().filter(String); // Sentences are now in Column C
    
    return ContentService
      .createTextOutput(JSON.stringify({ sentences: sentences }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // ... error handling
  }
}

/**
 * Calculates and returns the average ratings for all sentences.
 */
function getResults() {
  try {
    const ratingsSheet = getSheet(RATINGS_SHEET_NAME);
    if (!ratingsSheet || ratingsSheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify([])); // No ratings yet

    const ratingsData = ratingsSheet.getRange("A2:D" + ratingsSheet.getLastRow()).getValues();
    const stats = {}; // Use an object to store { sentence: { sum: X, count: Y } }

    ratingsData.forEach(row => {
      const sentence = row[2]; // Sentence is in column C
      const rating = row[3];   // Rating is in column D
      
      if (!stats[sentence]) {
        stats[sentence] = { sum: 0, count: 0 };
      }
      stats[sentence].sum += rating;
      stats[sentence].count++;
    });

    const results = Object.keys(stats).map(sentence => ({
      sentence: sentence,
      average: stats[sentence].sum / stats[sentence].count,
      count: stats[sentence].count
    }));

    // Sort from highest to lowest average
    results.sort((a, b) => b.average - a.average);

    return ContentService
      .createTextOutput(JSON.stringify(results))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // ... error handling
  }
}

/**
 * Handles POST requests for submissions and ratings.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'submission') {
      const sheet = getSheet(SENTENCES_SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "UserID", "Sentence"]); // Add headers
      }
      sheet.appendRow([new Date(), data.userId, data.sentence]); // Save timestamp, userId, and sentence
      // ... success response
    } else if (data.type === 'rating') {
      // ... rating logic remains the same
    } else {
      throw new Error("Invalid 'type' in request body.");
    }
  } catch (error) {
    // ... error handling
  }
}