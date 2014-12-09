function Controls(_camera,wrapper){
			var selected=null;
			var Z=5;
			var theta=0.0;
			var h=0.0;
			var Edown=null;
			var camera=_camera;
			var dollarWrapper=wrapper;
camera.position.z = Z;
this.setSelected=function(mesh){
	selected=mesh;
}
this.getSelected=function(){
	return selected;
}
this.render=function(){
	if(selected!=null){
				var x,y,z;
				c=Math.sqrt(Math.pow(Z,2)-Math.pow(h,2));
				x=c*Math.cos(theta);
				z=c*Math.sin(theta);

				camera.position.x = x;
				camera.position.y = h;
				camera.position.z = z;
				camera.lookAt(selected.position);
			}
	dollarwrapper.render();	
}
camera.rotation.order = "YXZ";
document.onmousedown = function(e) {
	switch(e.button){
		case 0:{
			Edown=e;
			break;
		}
		case 1:{
			break;
		}
		case 2:{
			wrapper.mouseDownEvent(e.clientX,e.clientY);
			break;
		}
	}
	
}
document.onmousemove = function(e) {
	var k=0.05;
	if(Edown!=null){
		if(selected==null){
			camera.rotation.y-= k*(e.pageX-Edown.pageX);
			camera.rotation.x-= k*(e.pageY-Edown.pageY);
			camera.rotation.x=Math.max(Math.min(camera.rotation.x,Math.PI/2),-Math.PI/2);
			}else{
				theta+= k*(e.pageX-Edown.pageX);
				if(theta<0){theta+=2*Math.PI;}
				else if(theta>2*Math.PI){theta-=2*Math.PI;}
		    		h+= k*(e.pageY-Edown.pageY);
				if(h<-(Z-0.1)){h=-(Z-0.1);}
				else if(h>(Z-0.1)){h=(Z-0.1);}
			}
	Edown=e
	}
	wrapper.mouseMoveEvent(e.clientX,e.clientY);
}
document.onmouseup = function(e) {
	Edown=null;
	wrapper.mouseUpEvent(e.clientX,e.clientY);
}

window.onkeydown = function (e) {
    var code = e.keyCode ? e.keyCode : e.which;
switch(code){
case 49://1
{
if(hemiLightIN){scene.remove( hemiLight );}
else{scene.add( hemiLight );}
hemiLightIN=!hemiLightIN;
break;
}
case 50:{
if(dirLightIN){scene.remove(dirLight);}
else{scene.add(dirLight);}
dirLightIN=!dirLightIN;
break;
}
case 51:{
if(lightIN){scene.remove(light);}
else{scene.add(light);}
lightIN=!lightIN;
break;
}
}

}

window.onkeypress=function(e){
	k=0.1;
	var code = e.keyCode ? e.keyCode : e.which;
	if (code === 119||code === 87||code === 38) { //38 up key
	var vector = new THREE.Vector3( 0, 0, -1 );
	vector.applyQuaternion( camera.quaternion );
	camera.position.x+=k*vector.x;
	//camera.position.y+=k*vector.y;
	camera.position.z+=k*vector.z;
    } else if (code === 115||code === 83||code === 40) { //40 down key
        var vector = new THREE.Vector3( 0, 0, 1 );
	vector.applyQuaternion( camera.quaternion );
	camera.position.x+=k*vector.x;
	//camera.position.y+=k*vector.y;
	camera.position.z+=k*vector.z;
    } 

    if (code === 100||code === 68||code === 39) { //39 right key
      var vector = new THREE.Vector3( 1, 0, 0 );
	vector.applyQuaternion( camera.quaternion );
	camera.position.x+=k*vector.x;
	//camera.position.y+=k*vector.y;
	camera.position.z+=k*vector.z;
    } else if (code === 97||code === 65||code === 37) { //37 left key
	var vector = new THREE.Vector3( -1, 0, 0 );
	vector.applyQuaternion( camera.quaternion );
	camera.position.x+=k*vector.x;
	//camera.position.y+=k*vector.y;
	camera.position.z+=k*vector.z;
    }
    if (code === 113||code === 32) { //38 jump key
	camera.position.y+=k;
    } else if (code === 101) { //40 crounch key
	camera.position.y-=k;
    } 
}

}