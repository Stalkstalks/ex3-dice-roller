$(document).ready(function(){
    console.log('ready');

    var resultsArea = $('#result');
    var oldResultsArea = $('#oldresults');
    var decodeArea = $('#decoded');
    var vcounter = 0;
    var lastDateStamp = 'Never';
    var lastSuccesses = 'n/a'

    // Clear old results off the screen.
    $('#clear').on('click tap', function(){
        $(".clearable").empty();
    });

    $('#roll').on('click tap', function(){

        var dicePool = $('input[name="dicepool"]').val();
        var targetNumber = $('input[name="targetnumber"]').val();
        var resultsArray = [];
        var resultsString = '';
        var successes = 0;
        var options = {};
        var botched = false;
        var onesSubtract = false;
        var encodedstring = '';
        var datestamp = new Date();
        
        var oncebutton = $('#rerollonce');
        var foreverbutton = $('#rerollforever');
        var onessubtract = $('#onessubtract');

        // Rerolling a number "forever" means until no dice show that number.
        // Need to check as soon as we get to the page, and then set based on user selections.
        if(oncebutton.is(':checked')){
            options.rerollForever = false;
        }else{
            options.rerollForever = true;
        }
        
        oncebutton.on('click tap', function(){
            options.rerollForever = false;
            foreverbutton.prop("checked", false);
            console.log('reroll forever button unchecked');
        });
        foreverbutton.on('click tap', function(){
            options.rerollForever = true;
            oncebutton.prop("checked", false);
            console.log('reroll once button unchecked');
        });
        
        
        // Do 1's reduce the number of successes you rolled?
        if(onessubtract.is(':checked')){
            onesSubtract = true;
        }else{
            onesSubtract = false;
        }

        // Doubles count as 2 successes.
        var doublesArray = getDiceChecks('double');
        options.doublesArray = doublesArray;

        var rerollArray = getDiceChecks('reroll');
        options.rerollArray = rerollArray;

        console.log('rolling dice');
        // Make the array that has all our raw dice roll results.
        for(var i = 0; i < dicePool; i++){
            var thisDie = rollDie(options, targetNumber, doublesArray, 0);
            console.log(thisDie);
            resultsArray.push(thisDie.result);
            if(thisDie.result == 1 && onesSubtract) {successes -= 1;}
            successes += thisDie.bonus;
        }
        
        // Botching: No successes and at least one 1 showing.
        if(successes <= 0){
            if(resultsArray.indexOf(1) != -1){
                botched = true
            }
        }

        resultsString = resultsArray.join(',');

        if(botched){
            resultsString = '<strong>Botch!</strong> Roll = ' + resultsString;
        }else{
            if(successes == 1){
                resultsString = '<strong>' + successes + ' success.</strong> Roll = ' + resultsString + '. ';
            }else{
                resultsString = '<strong>' + successes + ' successes.</strong> Roll = ' + resultsString + '. ';
            }
        }
        
        buttonCode = '<button class="showbutton showvcode' + vcounter + '">Info</button>';

        infoString = 'Timestamp: '
            + datestamp.toUTCString()
            + '<br/>Last roll: '
            + lastSuccesses;

        // Some of the results are encoded in the "secret code" gibberish.
        encodedstring = LZString.compressToUTF16(resultsString + '<br/>' + infoString);

        verificationCode = 'Verification Code:<br/>' + encodedstring;

        resultsArea.prepend('<p id=result' + vcounter + '>'
            + resultsString
            + buttonCode
            + '<br/><span class="hiddencode vcode' + vcounter + '">' 
            + infoString + '<br/>'
            + verificationCode + '<br/>'
            + '</span></p>'
        );

        // We intentionally only let people get the share code for their most recent roll.
        $('.showvcode' + (vcounter-1) ).remove();
        $('.vcode' + (vcounter-1) ).remove();
        $('#result' + (vcounter-1) ).detach().prependTo(oldResultsArea);

        // Don't need to have the gibberish code there all the time.
        $('.showvcode'+vcounter).on('click tap', function() {
            var myClass = this.className;
            var codeNumber = myClass.split(/\s+/)[1].replace('showvcode', '');
            $('.vcode'+codeNumber).slideToggle('fast');
        });

        vcounter += 1;
        lastDateStamp = datestamp.toUTCString();
        lastSuccesses = resultsString;

    });

    // Undo the gibberish code to show the original roll.
    $('#decode').on('click tap', function(){
        
        encodedString = $('#gibberish').val();
        decodedString = LZString.decompressFromUTF16(encodedString);
        decodeArea.prepend('<p>' + decodedString + '</p>');

    });

    // Returns a single die result.
    function rollDie(options, targetNumber, doublesArray, bonus){
        var result = Math.ceil(Math.random() * 10);
        
        // Need to keep successes on rerolls!
        if(result >= targetNumber){bonus += 1;}
        if(doublesArray.indexOf(result) != -1){bonus += 1;}

        
        // Check for rerolls. Two different types.
        if(options.rerollForever == false){
            // Reroll once? No recursion.
            if(options.rerollArray.indexOf(result) != -1){
                var newResult = Math.ceil(Math.random() * 10);
                if(newResult >= targetNumber){bonus += 1;}
                if(doublesArray.indexOf(newResult) != -1){bonus += 1;}
                return { result: newResult, bonus: bonus};
            }else{
                return { result: result, bonus: bonus };
            }        
        }
        else{
            // Reroll forever? Uses recursion.
            if(options.rerollArray.indexOf(result) != -1){
                return rollDie(options, targetNumber, doublesArray, bonus);
            }else{
                return { result: result, bonus: bonus };
            }
        }
    }
    
    // Returns an array saying which numbers have been checked off.
    function getDiceChecks(type){
        var result = []
        
        for(var i = 1; i <= 10; i++){
            var thistype = type + i
            if($('input[name="'+thistype+'"]').is(':checked')){
                result.push(i);
            }
        }

        return result;
    }
});