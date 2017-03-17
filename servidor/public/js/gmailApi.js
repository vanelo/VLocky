// Your Client ID can be retrieved from your project in the Google
// Developer Console, https://console.developers.google.com
var CLIENT_ID = ' 850797834093-idsmu6shqdtad14s8uob8kqffj5tm7uc.apps.googleusercontent.com';

var SCOPES = ['https://www.googleapis.com/auth/gmail.compose'];
/*********Secreto de cliente???? ***********/
 //9HIlHvfqq8N-X4E3sYN4fB-I 
/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
  var authorizeDiv = document.getElementById('authorize-div');
  if (authResult && !authResult.error) {
    // Hide auth UI, then load client library.
    authorizeDiv.style.display = 'none';
  } else {
    // Show auth UI, allowing the user to initiate authorization by
    // clicking authorize button.
    authorizeDiv.style.display = 'inline';
  }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
    handleAuthResult);
  return false;
}

function clean(){
  document.getElementById('email').value= "";
  document.getElementById('subject').value= "";
  document.getElementById('text').value= "";
}
/**
 * Calls an Apps Script function to send a email with the user
 * account's logged.
 */
function callScriptFunction() {
  var scriptId = "Mhs0NHkhdjPXCW9ye0sIf2Sg1QdnTS5aj";

  var email = document.getElementById('email').value;
  var subject = document.getElementById('subject').value
  var text = document.getElementById('text').value

  // Create an execution request object.
  var request = {
      'function': 'myFunction',
      'parameters': [email, subject, text],
      'devMode': true
      };

  // Make the API request.
  var op = gapi.client.request({
      'root': 'https://script.googleapis.com',
      'path': 'v1/scripts/' + scriptId + ':run',
      'method': 'POST',
      'body': request
  });

  op.execute(function(resp) {
    if (resp.error && resp.error.status) {
      // The API encountered a problem before the script
      // started executing.
      appendPre('Error calling API:');
      appendPre(JSON.stringify(resp, null, 2));
    } else if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details.
      // The values of this object are the script's 'errorMessage' and
      // 'errorType', and an array of stack trace elements.
      var error = resp.error.details[0];
      appendPre('Script error message: ' + error.errorMessage);

      if (error.scriptStackTraceElements) {
        // There may not be a stacktrace if the script didn't start
        // executing.
        appendPre('Script error stacktrace:');
        for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
          var trace = error.scriptStackTraceElements[i];
          appendPre('\t' + trace.function + ':' + trace.lineNumber);
        }
      }
    } else {
      // The structure of the result will depend upon what the Apps
      // Script function returns. Here, the function returns an Apps
      // Script Object with String keys and values, and so the result
      // is treated as a JavaScript object.
      var obj = resp.response.result;
      if (Object.keys(obj).length == 0) {
          appendPre('Nothing returned!');
      } else {
        appendPre('Returned from Google Script API:');
        Object.keys(obj).forEach(function(id){
          appendPre('\t' + obj[id] + ' (' + id  + ')');
        });
      }
    }
  });
}

/**
 * Append a pre element to the body containing the given message
 * as its text node.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('output');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}