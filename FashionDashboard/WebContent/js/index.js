currentPage = "loginPage";
MAIN_TAG = "burton snow";

function changePage(page) {
	$(".toHide").hide();
	$("#"+page).show();
	
	if (page == "loginPage") {
		$(".header-btn").hide();
		$("#fbLogin").show();
		$('.content').css('background-image',"url('images/background.jpg')");
		$("#titleDash").html("Burton Analytics");
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

