var currentPage = "loginPage";
var MAIN_TAG = "burton snow";
var FAKE_TAG = "Burton";
var processes = 5;
var brandWarArr = [];
var loadingProg = 0;
var TOT_PROC = 9;
var default_graph = [];
google.load('visualization', '1', {packages: ['corechart', 'line']});

//google.setOnLoadCallback(drawBasic);

$(document).ready(function(){	
	$('.results').hide();
	$('.loading').hide();
	changePage("loginPage");
});

function changePage(page) {
	
	$(".toHide").hide();
	$("#"+page).show();
	$('#loading-bar').hide();
	$('.top-reselect-input').hide();
	$('.top-reselect').hide();
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
		$('.top-reselect-input').show();
		$('.top-reselect').show();
		$("#brandPage").hide();
		$('#loading-dett').hide();
		populateDashboard();
	} else if (page == "brandPage"){
		$(".header-btn").show();
		$(".header-btn").html("Home");
		$(".header-btn").attr("onclick","goBackToHome()");
		$("#fbLogin").hide();
		$('.content').css('background-image','none');
		$("#brandPage").show();
		$('#loading-dett').hide();
	} else {
		$(".header-btn").show();
		$(".header-btn").html("Home");
		$(".header-btn").attr("onclick","goBackToHome()");
		$("#fbLogin").hide();
		$('.content').css('background-image','none');
	}
		
}

function reworkDashboard() {
	$('.results').hide();	
	$('#loading4').show();	
	var newTag = $('#input-refiner').val();
	if (newTag && newTag != "") {
		MAIN_TAG = newTag;
		FAKE_TAG = newTag;
	}
	console.log("Rework starting with "+newTag);
	changePage("dashPage");
		
}

function goBackToHome() {
	$("#dashPage").show();
	$(".pages").hide();
	$('#loading-bar').hide();
	$(".header-btn").show();
	$(".header-btn").html("Logout");
	$(".header-btn").attr("onclick","doLogout()");
	$("#fbLogin").hide();
	$('.content').css('background-image','none');
	$('.top-reselect-input').show();
	$('.top-reselect').show();
	$("#brandPage").hide();
	$('#loading-dett').hide();
}



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
	setTimeout(function(){updateLoading(1)},3000);
	
	console.log("Used tags -> "+[MAIN_TAG,"Billabong","Vans","Nitro","Airblaster"]);
//	callBrandwarAnalysis([MAIN_TAG,"Billabong","Vans","Nitro","Airblaster"]);
//	callKeywordAnalysis(MAIN_TAG);
//	callSentimentAnalysis(MAIN_TAG);	
	
//	$('#loading3').hide();
//  	$('#result3').show();
//	var arr1 = [[0,4],[100,13],[200,19]]; 
//	var arr2 = [[0,17],[100,9],[200,29]];
//	var otherTag = "Ciccio";
//	drawDouble(arr1,arr2, otherTag);
}

function computeRank() {
	$('#loading-dett').show();
	$('.brandwar-det-res').hide();
	var brandArray = [MAIN_TAG];
	for (var i = 1; i < 5; i++)
		brandArray.push($('#comp'+i).val());
	callBrandwarAnalysis(brandArray);
}

function compareSentiment() {
	var tmpText = $("#compare-text").val();
	console.log("Comparing with "+tmpText);
	if (tmpText && tmpText != "") {
		callSentimentAnalysis(tmpText, true);
	}	
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

function callSentimentAnalysis(inputTag, isCompare) {
	
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
  	    			graphArray.push([k*splitSize,parseFloat(tmpSentiment)*100]);
  	    		}
  	    		
  	    		if (isCompare) {
  	    			drawDouble(default_graph, graphArray, inputTag);
  	    		} else {
  	    			default_graph = graphArray;
  	    			drawBasic(graphArray);
  	    		}
  	    		
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
  	brandWarArr = [];
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
  	    		var tmpSentiment = data["positive"] ? data["positive"] : data["negative"];
  	    		if (inputTag == MAIN_TAG)
  	    			inputTag =  FAKE_TAG;
  	    		brandWarArr.push([inputTag,tmpSentiment]);
  	    		if (processes < 1) {
  	    			processes = 5;	    			
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
	$('#loading-dett').hide();
	$('.brandwar-det-res').show();
	for (var i=1; i < 6; i++) {
		var tmpObj = arr[i-1];
		$('#brandw'+i).html(tmpObj[0]+" ("+parseInt(tmpObj[1].toFixed(2)*100)+"%)");
		if (tmpObj[0] == FAKE_TAG)
			$('#brandw'+i).css('color','#0065DD');
	}
	brandWarArr = [];
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
        title: 'Popularity (%)'
      },
      legend: { position: 'bottom' },
      
    };

    var chart = new google.visualization.LineChart(document.getElementById('chart_sentiment'));

    chart.draw(data, options);
  }

function drawDouble(arr1,arr2, otherTag) {

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'X');
    data.addColumn('number', 'Popularity of '+FAKE_TAG);
    data.addColumn('number', 'Popularity of '+otherTag);

    var dataArray = [];
    for (var k in arr1) {
    	if (arr1[k][1] && arr2[k][1])
    		dataArray.push([arr1[k][0],arr1[k][1],arr2[k][1]]);
    }

    data.addRows(dataArray);

    var options = {
      hAxis: {
        title: 'Recent tweets'
      },
      vAxis: {
        title: 'Popularity (%)'
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
	$('#loading-bar').css('width',((parseFloat(loadingProg)/TOT_PROC)*96)+"%")
	if (loadingProg > TOT_PROC-1) 
		setTimeout(function(){$('#loading-bar').hide();},1000);
}

function compareBrands(a,b) {
	  return b[1]-a[1];
}

