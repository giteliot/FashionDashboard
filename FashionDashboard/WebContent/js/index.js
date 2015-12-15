currentPage = "loginPage";
MAIN_TAG = "burton snow";
google.load('visualization', '1', {packages: ['corechart', 'line']});
google.setOnLoadCallback(drawBasic);


function changePage(page) {
	$(".toHide").hide();
	$("#"+page).show();
	
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
	changePage("loginPage");
	//$(".content").css('background-size',""+window.width+"px "+window.height+"px");
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
	
	callKeywordAnalysis(MAIN_TAG);
	callSentimentAnalysis(MAIN_TAG);
}

function showError(text,id) {
	alert(text);
}

function callKeywordAnalysis(inputTag) {
	$.ajax({
		url: "keyword",
		type: 'GET',
//		contentType:'json',
		data: {
			tag: inputTag
		},
  		success: function(data) {
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
  	    	} else {
  	    		showError("Ooops...something went wrong!",2);
  	    	}
		},
		error: function(xhr, textStatus, thrownError) {
			$('#loading2').hide();
  	    	$('#result2').show(); 		
  	    	showError("Ooops...something went wrong!",2);
		}
	});
}

function callSentimentAnalysis(MAIN_TAG) {
	$('#loading3').hide();
  	$('#result3').show(); 
  	data = [ [0, 0],   [100, 2.44],  [200, -1.44],  [300, 3.0],  [400, 3.1],  [500, 2.5] ];
  	drawBasic(data);

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



