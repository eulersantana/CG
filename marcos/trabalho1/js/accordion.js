$(document).ready(function(){
	var a = $("a[data-toggle='collapse']");
	
	a.click(function(){
		var clicked = this;
		a.each(function(){
			if(this != clicked){
				var href = this.href.split("#");
				$("#"+href[1]).collapse('hide');
			}
		});
		var href = this.href.split("#");
		$("#"+href[1]).collapse("show");
	});

});