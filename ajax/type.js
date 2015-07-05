define(function(){
	var isType = function( type ){
		return function( obj ){
			return Object.prototype.toString.call( obj ) === "[object " + type + "]";
		};
	}

	var type = {};
	type.isNum    = isType( "Number" );
	type.isString = isType( "String" );
	type.isObject = isType( "Object" );
	type.isFunc   = isType( "Function" );
	type.isArray  = Array.isArray || isType( "Array" );
	

	return type;
});