function func( data ){
	console.log( '_______________________________________________' );
	console.log( data );
	console.log( "+++++++++++++++++++++++++++++++++++++" );
}

requirejs( ["http"], function( http ){
	http({ 
		url: "http://127.0.0.2:4000/wanglei.json", 
		crossDomain   : true   ,
		jsonpCallback : "func" ,
		data: { 
			name: "wanglei", 
			love: "houna" 
		}, 
		success: function( data){
			console.log( "_______________________________________________" );
			console.log( "success function is called" );
			console.log( arguments );
			console.log( "+++++++++++++++++++++++++++++++++++++++++++++++" );
		},

		error: function(){
			console.log( "))))))))))))))))))))))))))))))))))))))))))))))" );
			console.log( "error function is called" );
			console.log( arguments );
			console.log( "++++++++++++++++++++++++++++++" );
		},

		complete: function(){
			console.log( "complete function is called" );
			console.log( arguments );
			console.log( "_______________________________________________" );
		}
	});
});