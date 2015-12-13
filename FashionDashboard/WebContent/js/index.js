currentPage = "loginPage";

function changePage(page) {
	$(".toHide").hide();
	$("#"+page).show();
	
	if (page == "loginPage") {
		$(".header-btn").hide();
		$("#fbLogin").show();
		$('.content').css('background-image',"url('images/background.jpg')");
		$("titleDash").html("Burton Analytics");
	} else if (page == "dashPage") {
		$(".header-btn").show();
		$(".header-btn").html("Logout");
		$(".header-btn").attr("onclick","doLogout()");
		$("#fbLogin").hide();
		$('.content').css('background-image','none');
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
	$(".content").css('background-size',""+window.width+"px "+window.height+"px");
});

function doLogin(username) {
	$('#titleDash').html(username+"'s Burton Analytics");
	changePage("dashPage");
}

function doLogout() {
	changePage("loginPage");
}

function showSentimentDetail() {
	changePage("sentPage");
}

