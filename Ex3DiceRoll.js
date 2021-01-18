$(document).ready(function () {
  console.log('ready');

  let resultsArea = $('#result');
  let oldResultsArea = $('#oldresults');
  let decodeArea = $('#decoded');
  let vcounter = 0;
  let lastDateStamp = 'Never';
  let lastSuccesses = 'n/a';
  let options = {};

  // Clear old results off the screen.
  $('#clear').on('click', function () {
    $('.clearable').empty();
  });

  let onessubtract = $('#onessubtract');
  onessubtract.on('click', function (e) {
    console.log(e);
    if (!e.target.checked) {
      $('#onesub').show();
    } else {
      $('#onesub').hide();
    }
  });
  let oncebutton = $('#rerollonce');
  let foreverbutton = $('#rerollforever');

  // Rerolling a number "forever" means until no dice show that number.
  // Need to check as soon as we get to the page, and then set based on user selections.
  options.reroll = { once: false, forever: false };
  if (oncebutton.is(':checked')) {
    options.reroll.once = true;
  }
  if (foreverbutton.is(':checked')) {
    options.reroll.forever = true;
  }

  oncebutton.on('change', function () {
    options.reroll = checkBoxChecker('once');
    let rerollOnceArray = getDiceChecks('reroll');
    options.rerollOnceArray = rerollOnceArray;
  });
  foreverbutton.on('change', function () {
    options.reroll = checkBoxChecker('forever');
    let rerollForeverArray = getDiceChecks('reroll');
    options.rerollForeverArray = rerollForeverArray;
  });

  $('#roll').on('click', function () {
    let dicePool = $('input[name="dicepool"]').val();
    let targetNumber = $('input[name="targetnumber"]').val();
    let resultsArray = [];
    let bucketsArray = [0,0,0,0,0,0,0,0,0,0,0]
    let resultsString = '';
    let successes = 0;
    let botched = false;
    let onesSubtract = false;
    let datestamp = new Date();

    // Do 1's reduce the number of successes you rolled?
    if (onessubtract.is(':checked')) {
      onesSubtract = true;
    } else {
      onesSubtract = false;
    }

    // Doubles count as 2 successes.
    let doublesArray = getDiceChecks('double');
    options.doublesArray = doublesArray;

    if (options.reroll.once === true)
    {
      let rerollOnceArray = getDiceChecks('reroll');
      options.rerollOnceArray = rerollOnceArray;
    }
    
    if (options.reroll.forever === true)
    {
      let rerollForeverArray = getDiceChecks('reroll');
      options.rerollForeverArray = rerollForeverArray;
    }
    
    let resultsAllowedArray = [];
    for(i = 1; i < 11; i++)
    {
      if (rerollForeverArray.indexOf(i) == -1)
      {
        resultsAllowedArray.push(i);
      }
    }
    options.resultsAllowedArray = resultsAllowedArray;

    console.log('rolling dice');
    // Make the array that has all our raw dice roll results.
    for (let i = 0; i < dicePool; i++) {
      let thisDie = rollDie(options, targetNumber, doublesArray, 0);
      console.log(thisDie);
      resultsArray.push(thisDie.result);
      bucketsArray[thisDie.result] = bucketsArray[thisDie.result]+1;
      if (thisDie.result == 1 && onesSubtract) {
        successes -= 1;
      }
      successes += thisDie.bonus;
    }
    
    resultsArray.sort(function(a, b){return b-a});

    // Botching: No successes and at least one 1 showing.
    if (successes <= 0) {
      if (resultsArray.indexOf(1) != -1) {
        botched = true;
      }
    }

    //resultsString = resultsArray.join(',');
    for(let i = 10; i > 0; i--)
    {
      if(bucketsArray[i] > 0)
      {
        if(resultsString.length > 0)
          resultsString += ', '
        resultsString += "<strong>" + bucketsArray[i] + "</strong> "+i+"s";
      }
    }
    
    resultsString = resultsArray.join(',') + ".<br>" + resultsString;

    if (botched) {
      resultsString = '<strong>Botch!</strong> Roll = ' + resultsString;
    } else {
      if (successes == 1) {
        resultsString =
          '<strong>' +
          successes +
          ' success.</strong> Roll = ' +
          resultsString +
          '. ';
      } else {
        resultsString =
          '<strong>' +
          successes +
          ' successes.</strong> Roll = ' +
          resultsString +
          '. ';
      }
    }

    let buttonCode = $('<button>');
    buttonCode.addClass('showbutton');
    buttonCode.addClass('showvcode' + vcounter);
    buttonCode.html('Info');

    let hiddenCode = $('<span>');
    hiddenCode.addClass('hiddencode');
    hiddenCode.addClass('vcode' + vcounter);

    let infoString =
      'Timestamp: ' +
      datestamp.toUTCString() +
      '<br/>Last roll: ' +
      lastSuccesses +
      '<br/>Verification Code:';

    // Some of the results are encoded in the "secret code" gibberish.
    let encodedstring = LZString.compressToUTF16(
      resultsString + '<br/>' + infoString
    );

    let encodedResult = $('<input>');
    encodedResult.attr('type', 'text');
    encodedResult.prop('readonly', true);
    encodedResult.css('display', 'inline');
    encodedResult.val(encodedstring);
    encodedResult.on('focus', function () {
      $(this).select();
    });

    hiddenCode.append(infoString);
    hiddenCode.append(encodedResult);

    let theseResults = $('<p>');
    theseResults.attr('id', 'result' + vcounter);
    theseResults.append(resultsString);
    theseResults.append(buttonCode);
    theseResults.append('<br/>');
    theseResults.append(hiddenCode);

    resultsArea.prepend(theseResults);

    // We intentionally only let people get the share code for their most recent roll.
    $('.showvcode' + (vcounter - 1)).remove();
    $('.vcode' + (vcounter - 1)).remove();
    $('#result' + (vcounter - 1))
      .detach()
      .prependTo(oldResultsArea);

    // Don't need to have the gibberish code there all the time.
    $('.showvcode' + vcounter).on('click', function () {
      let myClass = this.className;
      let codeNumber = myClass.split(/\s+/)[1].replace('showvcode', '');
      $('.vcode' + codeNumber).slideToggle('fast');
    });

    vcounter += 1;
    lastDateStamp = datestamp.toUTCString();
    lastSuccesses = resultsString;
  });

  // Undo the gibberish code to show the original roll.
  $('#decode').on('click', function () {
    let encodedString = $('#gibberish').val();
    let decodedString = LZString.decompressFromUTF16(encodedString);
    decodeArea.prepend('<p>' + decodedString + '</p>');
  });

  // Returns a single die result.
  function rollDie(options, targetNumber, doublesArray, bonus) {
    console.log(options);
    
    let result = options.resultsAllowedArray[Math.floor(Math.random() * options.resultsAllowedArray.length)];

    if (options.rerollOnceArray.indexOf(result) != -1) {
      result = options.resultsAllowedArray[Math.floor(Math.random() * options.resultsAllowedArray.length)];
    }
    
    // Need to keep successes on rerolls!
    if (result >= targetNumber) {
      bonus += 1;
    }
    if (doublesArray.indexOf(result) != -1) {
      bonus += 1;
    }
    
    return { result: result, bonus: bonus };
    
    // Check for rerolls. Two different types.
    /*
    if (options.reroll.once === true) {
      // Reroll once? No recursion.
      if (options.rerollArray.indexOf(result) != -1) {
        let newResult = Math.ceil(Math.random() * 10);
        if (newResult >= targetNumber) {
          bonus += 1;
        }
        if (doublesArray.indexOf(newResult) != -1) {
          bonus += 1;
        }
        return { result: newResult, bonus: bonus };
      } else {
        return { result: result, bonus: bonus };
      }
    } else if (options.reroll.forever === true) {
      // Reroll forever? Uses recursion.
      if (options.rerollArray.indexOf(result) != -1) {
        return rollDie(options, targetNumber, doublesArray, bonus);
      } else {
        return { result: result, bonus: bonus };
      }
    } else {
      // No rerolls.
      return { result: result, bonus: bonus };
    }*/
  }

  // Returns an array saying which numbers have been checked off.
  function getDiceChecks(type) {
    let result = [];

    for (let i = 1; i <= 10; i++) {
      let thistype = type + i;
      if ($('input[name="' + thistype + '"]').is(':checked')) {
        result.push(i);
      }
    }

    return result;
  }

  function checkBoxChecker(box) {
    let once = false;
    let forever = false;

    if (box == 'once') {
      if (oncebutton.is(':checked')) {
        foreverbutton.prop('checked', false);
        once = true;
        console.log('reroll once');
      }
    } else {
      if (foreverbutton.is(':checked')) {
        oncebutton.prop('checked', false);
        forever = true;
        console.log('reroll forever');
      }
    }

    return { once: once, forever: forever };
  }
});
