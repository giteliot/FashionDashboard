currentPage = "loginPage";

function changePage(page) {
	$(".toHide").hide();
	$("#"+page).show();
	
	if (page == "loginPage") {
		$(".header-btn").hide();
	} else if (page == "dashPage") {
		$(".header-btn").show();
		$(".header-btn").html("Logout");
		$(".header-btn").attr("onclick","doLogout()");
	} else {
		$(".header-btn").show();
		$(".header-btn").html("Home");
		$(".header-btn").attr("onclick","doLogin()");
	}
		
}

$(document).ready(function(){	
	changePage("loginPage");
});

function doLogin() {
	changePage("dashPage");
}

function doLogout() {
	changePage("loginPage");
}

function showSentimentDetail() {
	changePage("sentPage");
}

