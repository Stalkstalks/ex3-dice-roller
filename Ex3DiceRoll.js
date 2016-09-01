$(document).ready(function(){
    console.log('ready');

    var resultsArea = $('#result');
    var oldResultsArea = $('#oldresults');
    var decodeArea = $('#decoded');
    var vcounter = 0;
    var lastDateStamp = 'Never';
    var lastSuccesses = 'n/a'

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

        if(oncebutton.is(':checked')){
            options.rerollForever = false;
        }else{
            options.rerollForever = true;
        }
        
        if(onessubtract.is(':checked')){
            onesSubtract = true;
        }else{
            onesSubtract = false;
        }
        
        oncebutton.on('click tap', function(){
            options.rerollForever = false;
            foreverbutton.prop("checked", false);
        });
        foreverbutton.on('click tap', function(){
            options.rerollForever = true;
            oncebutton.prop("checked", false);
        });
        
        var doublesArray = getDiceChecks('double');
        options.doublesArray = doublesArray;

        var rerollArray = getDiceChecks('reroll');
        options.rerollArray = rerollArray;

        for(var i = 0; i < dicePool; i++){
            var thisDie = rollDie(options);
            resultsArray.push(thisDie);
            if(thisDie >= targetNumber){successes += 1;}
            if(thisDie == 1 && onesSubtract) {successes -= 1;}
            if(doublesArray.indexOf(thisDie) != -1){successes += 1;}
        }

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

        $('.showvcode' + (vcounter-1) ).remove();
        $('.vcode' + (vcounter-1) ).remove();
        $('#result' + (vcounter-1) ).detach().prependTo(oldResultsArea);

        $('.showvcode'+vcounter).on('click tap', function() {
            var myClass = this.className;
            var codeNumber = myClass.split(/\s+/)[1].replace('showvcode', '');
            $('.vcode'+codeNumber).slideToggle('fast');
        });

        vcounter += 1;
        lastDateStamp = datestamp.toUTCString();
        lastSuccesses = resultsString;

    });

    $('#decode').on('click tap', function(){
        
        encodedString = $('#gibberish').val();
        decodedString = LZString.decompressFromUTF16(encodedString);
        decodeArea.prepend('<p>' + decodedString + '</p>');

    });

    function rollDie(options){
        var result = Math.ceil(Math.random() * 10);
        
        // Check for rerolls. Two different types.
        if(options.rerollForever == false){
            // Reroll once?
            if(options.rerollArray.indexOf(result) != -1){
                return Math.ceil(Math.random() * 10);
            }else{
                return result;
            }        
        }
        else{
            // Reroll infinite times?
            if(options.rerollArray.indexOf(result) != -1){
                return rollDie(options);
            }else{
                return result;
            }
        }
    }
    
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