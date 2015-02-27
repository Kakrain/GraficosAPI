function DollarWrapper(_renderer){
	//Array de los puntos
	var points = new Array();
	//Array de los Sprites
	var sprites= [];
	//Dollar.js
	var dollar = new DollarRecognizer();
	var isDown = false;
	var renderer=_renderer;
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer.autoClear = false;
	//Camara ortografica.
	var cameraOrtho = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
	cameraOrtho.position.z = 10;
	var sceneOrtho = new THREE.Scene();
	//Impresion de gesto.
	this.printGesture=false;
	this.center=[0,0];

	//Funcion de Renderizado.
	this.render=function(){
		renderer.render( sceneOrtho, cameraOrtho );
	}
	//Funcion de Anadir Sprite.
	function addSprite(x,y){
		var sprite = new THREE.Sprite( new THREE.SpriteMaterial( {color:'yellow'} ) );
		sprite.scale.set( 4, 4, 1 );
		sprite.position.set( x, y, 1 );
		sceneOrtho.add( sprite );
		sprites[sprites.length]=sprite;
	}
	//Funcion de limpiado de sprites.
	function clearSprites(){
		for (var i = sprites.length - 1; i >= 0; i--) {
			sceneOrtho.remove(sprites[i]);
		};
		sprites=[];
	}
	//Mouse Down event.
	this.mouseDownEvent=function(x, y)
	{
	this.center[0]=x;
	this.center[1]=y;
	
	isDown = true;
	points[0] = new Point(x, y);
	x-=width/2;
	y=height/2-y;
	
	points.length = 1; // clear
	addSprite(x,y);
}
//Dibujado de los Sprites.
this.mouseMoveEvent=function(x, y)
{
	if (isDown)
	{
		points[points.length] = new Point(x, y);// append
		x-=width/2;
		y=height/2-y;
		addSprite(x,y);
	}
}
//Reconocimiento del gesto.
this.mouseUpEvent=function(x, y)
{
	this.center[0]+=x;
	this.center[1]+=y;
	this.center[0]=this.center[0]/2;
	this.center[1]=this.center[1]/2;
	var nameAndCentr = [];
	var name=null;
	if (isDown)
	{
		isDown = false;
		if (points.length >= 10)
		{
			var result = dollar.Recognize(points,false);
			var centroid = Centroid(points);
			$.notify("Result: " + result.Name + " (" + round(result.Score,2) + ").",{autoHide:true,clickToHide:true,position:"left top"});
			if(this.printGesture){
				var s="new Unistroke(name,new Array(";
					for (var i = 0; i <points.length; i+=3) {
						s+="new Point("+Math.floor(points[i].X)+","+Math.floor(points[i].Y)+"),";
					};
					s+="));"
			$.notify(s,{autoHide:false,clickToHide:false,position:left});
		}
			//Seteamos los valores que obtenemos.
			name=result.Name;
			nameAndCentr[0] = name;
			nameAndCentr[1] = centroid;
		}
		else // fewer than 10 points were inputted
		{
			//$.notify("Too few points made. Please try again.",{autoHide:true,clickToHide:true,position:"top center"});
		}
		points=[];
		clearSprites();
	}
	return nameAndCentr;
}

function round(n, d) // round 'n' to 'd' decimals
{
	d = Math.pow(10, d);
	return Math.round(n * d) / d
}

}