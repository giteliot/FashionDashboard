var currentPage = "loginPage";
var MAIN_TAG = "burton snow";
var FAKE_TAG = "Burton";
var processes = 5;
var brandWarArr = [];
var loadingProg = 0;
var TOT_PROC = 9;
google.load('visualization', '1', {packages: ['corechart', 'line']});
google.setOnLoadCallback(drawBasic);

function changePage(page) {
	$(".toHide").hide();
	$("#"+page).show();
	$('#loading-bar').hide();
	if (page == "loginPage") {
		$(".header-btn").hide();
		$("#fbLogin").show();
		$('.content').css('background-image',"url('images/background.jpg')");
		$("#titleDash").html("Burton Analytics");
		$('.results').hide();
		$('.loading').hide();
	} else if (page == "dashPage") {
		$(".header-btn").show();
		$(".header-btn").html("Logout");
		$(".header-btn").attr("onclick","doLogout()");
		$("#fbLogin").hide();
		$('.content').css('background-image','none');
		$('.results').hide();
		$('.loading').show();
		populateDashboard();
	} else {
		$(".header-btn").show();
		$(".header-btn").html("Home");
		$(".header-btn").attr("onclick","doLogin()");
		$("#fbLogin").hide();
		$('.content').css('background-image','none');
	}
		
}

$(document).ready(function(){	
	$('.results').hide();
	$('.loading').hide();
	changePage("loginPage");
});

function doLogin(username) {
	if (username)
		$('#titleDash').html(username+"'s Burton Analytics");
	changePage("dashPage");
}

function doLogout() {
	changePage("loginPage");
}

function showSentimentDetail() {
	changePage("sentPage");
}

function populateDashboard() {
	loadingProg = 0;
	$('#loading-bar').show();
	updateLoading(1);
	setTimeout(function(){updateLoading(1)},1500);
	
	callBrandwarAnalysis([MAIN_TAG,"Billabong","Vans","Nitro","Airblaster"]);
	callKeywordAnalysis(MAIN_TAG);
	callSentimentAnalysis(MAIN_TAG);	
	
}

function showError(text,id) {
	//alert(text);
}

function callKeywordAnalysis(inputTag) {
	$('#loading2').show();
  	$('#result2').hide();
	$.ajax({
		url: "keyword",
		type: 'GET',
//		contentType:'json',
		data: {
			tag: inputTag
		},
  		success: function(data) {
  			updateLoading(1);
  	    	$('#loading2').hide();
  	    	$('#result2').show();
  	    	
  	    	if (typeof data == "string")
  	    		data = $.parseXML(data);
  	    	data = JSON.parse(xml2json(data,""));
  	    	console.log(JSON.stringify(data));
//  	    	var score = data.results.docSentiment.score;
//  	    	var sentiment = data.results.docSentiment.type;
  	    	if (data && data.results && data.results.concepts) {
  	    		var arrConcepts = data.results.concepts.concept;
  	    		//alert(JSON.stringify(arrConcepts));
  	    		for (var i  = 0; i < arrConcepts.length; i++) {
  	    			if (i > 4)
  	    				break;
  	    			$('#keyword'+i).html(arrConcepts[i].text);
  	    		}
  	    		
  	    		readTweetsAndWrite("tweets/savedTweets.txt");
  	    		$('#dash4').show();
  	    		$('#loading4').hide();
  	    	} else {
  	    		showError("Ooops...something went wrong!",2);
  	    	}
		},
		error: function(xhr, textStatus, thrownError) {
			updateLoading(1);
			$('#loading2').hide();
  	    	$('#result2').show(); 		
  	    	showError("Ooops...something went wrong!",2);
		}
	});
}

function callSentimentAnalysis(inputTag) {
	
	$('#loading3').show();
  	$('#result3').hide(); 
  	var splitSize = 100;
	$.ajax({
		url: "sentiment",
		type: 'GET',
		contentType:'json',
		data: {
			tag: inputTag,
			split: splitSize
		},
  		success: function(data) {
  			updateLoading(1);
  	    	$('#loading3').hide();
  	    	$('#result3').show();
  	    	
  	    	if (typeof data == "string")
  	    		data = JSON.parse(data);
  	    	
  	    	if (data && data.length > 0) {
  	    		var graphArray = [];
  	    		for (var k in data) {
  	    			var tmpSentiment = data[k]["positive"] ? data[k]["positive"] : data[k]["negative"];
  	    			graphArray.push([k*splitSize,parseFloat(tmpSentiment)]);
  	    		}
  	    		drawBasic(graphArray);
  	    	} else {
  	    		showError("Ooops...something went wrong!",3);
  	    	}
		},
		error: function(xhr, textStatus, thrownError) {
			updateLoading(1);
			$('#loading3').hide();
		  	$('#result3').show(); 		
  	    	showError("Ooops...something went wrong!",3);
		}
	});
	  	

}


function callBrandwarAnalysis(arrStuff) {
	$('#loading1').show();
  	$('#result1').hide();
  	processes = 5;
  	for (i = 0; i < 5; i++) {
  		callSingleSentiment(arrStuff[i]);
  	}
  	
}

function callSingleSentiment(inputTag) {
	$.ajax({
		url: "sentiment",
		type: 'GET',
		contentType:'json',
		data: {
			tag: inputTag,
		},
  		success: function(data) {  	
  			updateLoading(1);
  	    	if (typeof data == "string")
  	    		data = JSON.parse(data);
  	    	
  	    	if (data) {   		
  	    		processes -= 1;
  	    		$('#loading-bar').css('width',(5-processes)*20+"%");
  	    		var tmpSentiment = data["positive"] ? data["positive"] : data["negative"];
  	    		if (inputTag == MAIN_TAG)
  	    			inputTag =  FAKE_TAG;
  	    		brandWarArr.push([inputTag,tmpSentiment]);
  	    		if (processes < 1) {
  	    			brandWarArr.sort(compareBrands);
  	    			printBrandwar(brandWarArr);
  	    		}
  	    	} else {	    		
  	    		$('#loading1').hide();
  			  	$('#result1').show(); 	
  			  	processes = -1;
  			  	showError("Ooops...something went wrong!",1);
  	    	}
		},
		error: function(xhr, textStatus, thrownError) {
			updateLoading(1);
			$('#loading1').hide();
		  	$('#result1').show(); 		
		  	processes = -1;
  	    	showError("Ooops...something went wrong!",1);
		}
	});
	  	
	
	
}

function printBrandwar(arr) {
	$('#loading1').hide();
	$('#result1').show(); 	
	for (var i=1; i < 6; i++) {
		var tmpObj = arr[i-1];
		$('#brandw'+i).html(tmpObj[0]+" ("+parseInt(tmpObj[1].toFixed(2)*100)+"%)");
		if (tmpObj[0] == FAKE_TAG)
			$('#brandw'+i).css('color','#0065DD');
	}
}

function drawBasic(dataArray) {

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'X');
    data.addColumn('number', 'Popularity, based on recent tweets');

    data.addRows(dataArray);

    var options = {
      hAxis: {
        title: 'Recent tweets'
      },
      vAxis: {
        title: 'Popularity'
      },
      legend: { position: 'bottom' },
      
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_sentiment'));

    chart.draw(data, options);
  }

function readTweetsAndWrite(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                $('#tweets-date').html(decodeURIComponent(escape(allText.substring(0,47))))
                $('#tw-list').html(decodeURIComponent(escape(allText.substring(47,allText.length).trim())));
                
            }
        }
    }
    rawFile.send(null);
}

function updateLoading(n) {
	console.log(loadingProg);
	loadingProg += n;
	$('#loading-bar').css('width',((parseFloat(loadingProg)/TOT_PROC)*100)+"%")
	if (loadingProg > TOT_PROC-1) 
		setTimeout(function(){$('#loading-bar').hide();},1000);
}

function compareBrands(a,b) {
	  return b[1]-a[1];
	}
