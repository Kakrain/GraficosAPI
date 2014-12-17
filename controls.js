function Controls(_camera,wrapper,_meshes,_scene,_piso){
			var scene=_scene;
			var selected=null;
			var Z=5;
			var theta=0.0;
			var h=0.0;
			var Edown=null;
			var camera=_camera;
			var meshes=_meshes;
			var dollarWrapper=wrapper;
			var	mouseVector = new THREE.Vector3();
			var raycaster =  new THREE.Raycaster();
			var velocity=0.1;
			var forward=false;
			var backward=false;
			var right=false;
			var left=false;
			var up=false;
			var down=false;
			var piso=_piso;

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

				camera.position.x = x+selected.position.x;
				camera.position.y = h+selected.position.y;
				camera.position.z = z+selected.position.z;
				camera.lookAt(selected.position);
			}else{
				var vector = new THREE.Vector3( 0, 0, -1 );
					vector.applyQuaternion( camera.quaternion );
					if (forward) { //38 up key
					camera.position.x+=velocity*vector.x;
					camera.position.z+=velocity*vector.z;
				    } else if (backward) { 
					camera.position.x-=velocity*vector.x;
					camera.position.z-=velocity*vector.z;
				    } 
				    vector = new THREE.Vector3( 1, 0,0);
					vector.applyQuaternion( camera.quaternion );
				    if (right) { //39 right key
					camera.position.x+=velocity*vector.x;
					camera.position.z+=velocity*vector.z;
				    } else if (left) { //37 left key
					camera.position.x-=velocity*vector.x;
					camera.position.z-=velocity*vector.z;
				    }
				    if (up) { //38 jump key
					camera.position.y+=velocity;
				    } else if (down) { //40 crounch key
					camera.position.y-=velocity;
				    } 
			}
	dollarwrapper.render();	
}
camera.rotation.order = "YXZ";
document.onmousedown = function(e) {
	switch(e.button){
		case 0:{
			
			mouseVector.x = 2 * (e.clientX / window.innerWidth) - 1;
		mouseVector.y = 1 - 2 * ( e.clientY / window.innerHeight );
		mouseVector.unproject(camera);
//projector.unprojectVector(mouseVector, camera);
mouseVector.sub(camera.position);
mouseVector.normalize();

raycaster.set(camera.position, mouseVector);
			Edown=e;
			intersects = raycaster.intersectObjects(meshes);
			if(intersects.length!=0){

				selected=intersects[0].object;
				Z=selected.position.distanceTo(camera.position);
				h=camera.position.y-selected.position.y;
			}
			break;
		}
		case 1:{
			selected=null;
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
	var name=wrapper.mouseUpEvent(e.clientX,e.clientY);
	if(name=="zig-zag"){
var xy=wrapper.center;
$.notify("xy: "+xy);
//e.clientX 
		mouseVector.x = 2 * (xy[0]/ window.innerWidth) - 1;
		mouseVector.y = 1 - 2 * (xy[1]/ window.innerHeight );
		mouseVector.unproject(camera);
		mouseVector.sub(camera.position);
		mouseVector.normalize();

			raycaster.set(camera.position, mouseVector);

			intersects = raycaster.intersectObject(piso);
			if(intersects.length!=0){
				var p=intersects[0].point;
				//createSphere(p.x,p.y,p.z,'red');
			var v=cube.position.clone();
			v.sub(p);
			v.normalize();
			raycaster.set(cube.position,v);
			raycaster.ray.at(5,p);
			//createSphere(p.x,p.y,p.z,'blue');
				var light = new THREE.SpotLight( 0xffffff, 1 );
				light.castShadow = true;
				light.shadowDarkness = 0.7;
				light.shadowCameraRight =  1;
				light.shadowCameraLeft = -1;
				light.shadowCameraTop =  1;
				light.shadowCameraBottom = -1;
				light.target=cube;


				light.position.x=p.x;
				light.position.y=p.y;
				light.position.z=p.z;
				//light.position.set(p);
				light.shadowCameraFar = 10;
    			light.shadowCameraNear=1;
				//light.target.updateMatrixWorld();
				light.shadowCameraVisible = true;
				scene.add(light);
				//meshes.push(light);

floor.material.needsUpdate = true;
cube.material.needsUpdate = true;

}
	}
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

case 38: // up
case 87: // w
	forward = true;
	break;
case 37: // left
case 65: // a
	left = true; 
	break;
case 40: // down
case 83: // s
	backward = true;
	break;
case 39: // right
case 68: // d
	right = true;
	break;
case 32: // space
case 81:
	up = true;
	break;
case 17: // space
case 69:
	down = true;
	break;

}

}
window.onkeyup=function(e){
 var code = e.keyCode ? e.keyCode : e.which;
 switch( code ) {
			case 38: // up
			case 87: // w
				forward = false;
				break;
			case 37: // left
			case 65: // a
				left = false;
				break;
			case 40: // down
			case 83: // s
				backward = false;
				break;
			case 39: // right
			case 68: // d
				right = false;
				break;
			case 32: // space
			case 81:
				up = false;
				break;
			case 17: // space
			case 69:
				down = false;
				break;
		}
}

function createSphere(x,y,z,color){
	var sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshPhongMaterial({color: color}) );
	sphere.position.x = x;
	sphere.position.y = y;
	sphere.position.z = z;
	scene.add(sphere);
}


}