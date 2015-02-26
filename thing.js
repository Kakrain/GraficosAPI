function Thing(_mesh,_scene,_floors){
	//Variables locales.
	var self=this;
	var floors=_floors; //Pisos del mesh
	var meshes=[]; //meshes
	var scene=_scene; //Escena 
	meshes[meshes.length]=_mesh;
	var box = new THREE.Box3().setFromObject(meshes[0]);
	var dx=box.max.x-box.min.x;
	var dy=box.max.y-box.min.y;
	var dz=box.max.z-box.min.z;
	var v=new THREE.Vector3();
	var v2=new THREE.Vector3();

	var material= new THREE.MeshBasicMaterial( {color:'red', side:THREE.DoubleSide, transparent:true, opacity:0.5} );
	//Sombra xz del mesh.
	var xz=new THREE.Mesh( new THREE.PlaneBufferGeometry( dx, dz, 1, 1 ), material );
	//SOmbra xy del mesh.
	var xy=new THREE.Mesh( new THREE.PlaneBufferGeometry( dx, dy, 1, 1 ), material );
	//Sombra yz del mesh.
	var yz=new THREE.Mesh( new THREE.PlaneBufferGeometry( dy, dz, 1, 1 ), material );
	//Create a ilusion about the selected item creating a backside object with a fluorescent color, then resize for making bigger.
	var outline;
	
	//Rotamos las sombras para ubicarlas en los planos respectivos.
	yz.position.set(0.01,_mesh.position.y,_mesh.position.z);
	yz.rotation.y=Math.PI/2
	
	xz.position.set(_mesh.position.x,0.01,_mesh.position.z);
	xz.rotation.x=Math.PI/2;
	
	xy.position.set(_mesh.position.x,_mesh.position.y,0.01);


	//Anadimos las sombras al mesh.
	meshes[meshes.length]=xz;
	meshes[meshes.length]=xy;
	meshes[meshes.length]=yz;
	
	//Creamos y anadimos el outline al mesh.
	outline = new THREE.Mesh( meshes[0].geometry, new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide } ) );
	outline.scale.multiplyScalar(1.05);
	meshes[meshes.length]=outline;
	this.outlineOrientation=null;
	this.interpoint=null;

	//Los sizers que utilizamos para hacer escalamiento del mesh. 1 por cada cara del cubo imaginario.
	var sizeSizers=5;
	var c;
	c=new THREE.Mesh(new THREE.BoxGeometry(sizeSizers,sizeSizers,sizeSizers),new THREE.MeshBasicMaterial({color: 0x0f0f0f}));
	c.position.set(meshes[0].position.x+dx/2+sizeSizers/2,meshes[0].position.y,meshes[0].position.z);
	meshes[meshes.length]=c;
	c=new THREE.Mesh(new THREE.BoxGeometry(sizeSizers,sizeSizers,sizeSizers),new THREE.MeshBasicMaterial({color: 0x0f0f0f}));
	c.position.set(meshes[0].position.x,meshes[0].position.y+dy/2+sizeSizers/2,meshes[0].position.z);
	meshes[meshes.length]=c;
	c=new THREE.Mesh(new THREE.BoxGeometry(sizeSizers,sizeSizers,sizeSizers),new THREE.MeshBasicMaterial({color: 0x0f0f0f}));
	c.position.set(meshes[0].position.x,meshes[0].position.y,meshes[0].position.z+dz/2+sizeSizers/2);
	meshes[meshes.length]=c;
	c=new THREE.Mesh(new THREE.BoxGeometry(sizeSizers,sizeSizers,sizeSizers),new THREE.MeshBasicMaterial({color: 0x0f0f0f}));
	c.position.set(meshes[0].position.x-(dx/2+sizeSizers/2),meshes[0].position.y,meshes[0].position.z);
	meshes[meshes.length]=c;
	c=new THREE.Mesh(new THREE.BoxGeometry(sizeSizers,sizeSizers,sizeSizers),new THREE.MeshBasicMaterial({color: 0x0f0f0f}));
	c.position.set(meshes[0].position.x,meshes[0].position.y-(dy/2+sizeSizers/2),meshes[0].position.z);
	meshes[meshes.length]=c;
	c=new THREE.Mesh(new THREE.BoxGeometry(sizeSizers,sizeSizers,sizeSizers),new THREE.MeshBasicMaterial({color: 0x0f0f0f}));
	c.position.set(meshes[0].position.x,meshes[0].position.y,meshes[0].position.z-(dz/2+sizeSizers/2));
	meshes[meshes.length]=c;

	//Solo mostramos el primer mesh al agregarlo a la escena, conforme cambie de estado se agregan los demas componentes.
	scene.add(meshes[0]);



	//Funcion para hacer que el outline siempre siga al mesh corresponidente.
	var setOutlinePosition=function(){
		outline.position.x = meshes[0].position.x;
		outline.position.y = meshes[0].position.y;
		outline.position.z = meshes[0].position.z;
	}
	//Funcion para poder acceder al updater.
	this.updateSizers=function(){
		updateSizers();
	}

	//Funcion que realiza el resize del mesh usando los sizers ubicados en el mesh seleccionado.
	var updateSizers=function(){
		v.set(1,0,0);
		v.applyQuaternion(meshes[0].quaternion);
		meshes[5].position.set(meshes[0].position.x+(dx*meshes[0].scale.x/2+sizeSizers/2)*v.x,meshes[0].position.y+(dx*meshes[0].scale.x/2+sizeSizers/2)*v.y,meshes[0].position.z+(dx*meshes[0].scale.x/2+sizeSizers/2)*v.z);
		meshes[5].rotation.set(meshes[0].rotation.x,meshes[0].rotation.y,meshes[0].rotation.z);
		v.set(0,1,0);
		v.applyQuaternion(meshes[0].quaternion);
		meshes[6].position.set(meshes[0].position.x+(dy*meshes[0].scale.y/2+sizeSizers/2)*v.x,meshes[0].position.y+(dy*meshes[0].scale.y/2+sizeSizers/2)*v.y,meshes[0].position.z+(dy*meshes[0].scale.y/2+sizeSizers/2)*v.z);
		meshes[6].rotation.set(meshes[0].rotation.x,meshes[0].rotation.y,meshes[0].rotation.z);
		v.set(0,0,1);
		v.applyQuaternion(meshes[0].quaternion);
		meshes[7].position.set(meshes[0].position.x+(dz*meshes[0].scale.z/2+sizeSizers/2)*v.x,meshes[0].position.y+(dz*meshes[0].scale.z/2+sizeSizers/2)*v.y,meshes[0].position.z+(dz*meshes[0].scale.z/2+sizeSizers/2)*v.z);
		meshes[7].rotation.set(meshes[0].rotation.x,meshes[0].rotation.y,meshes[0].rotation.z);

		v.set(-1,0,0);
		v.applyQuaternion(meshes[0].quaternion);
		meshes[8].position.set(meshes[0].position.x+(dx*meshes[0].scale.x/2+sizeSizers/2)*v.x,meshes[0].position.y+(dx*meshes[0].scale.x/2+sizeSizers/2)*v.y,meshes[0].position.z+(dx*meshes[0].scale.x/2+sizeSizers/2)*v.z);
		meshes[8].rotation.set(meshes[0].rotation.x,meshes[0].rotation.y,meshes[0].rotation.z);
		v.set(0,-1,0);
		v.applyQuaternion(meshes[0].quaternion);
		meshes[9].position.set(meshes[0].position.x+(dy*meshes[0].scale.y/2+sizeSizers/2)*v.x,meshes[0].position.y+(dy*meshes[0].scale.y/2+sizeSizers/2)*v.y,meshes[0].position.z+(dy*meshes[0].scale.y/2+sizeSizers/2)*v.z);
		meshes[9].rotation.set(meshes[0].rotation.x,meshes[0].rotation.y,meshes[0].rotation.z);
		v.set(0,0,-1);
		v.applyQuaternion(meshes[0].quaternion);
		meshes[10].position.set(meshes[0].position.x+(dz*meshes[0].scale.z/2+sizeSizers/2)*v.x,meshes[0].position.y+(dz*meshes[0].scale.z/2+sizeSizers/2)*v.y,meshes[0].position.z+(dz*meshes[0].scale.z/2+sizeSizers/2)*v.z);
		meshes[10].rotation.set(meshes[0].rotation.x,meshes[0].rotation.y,meshes[0].rotation.z);
	}

	//Funcion para mover el conjunto del thing conforme a la posicion del raycaster.
	this.moveTo=function(index,raycast,plane){
		if(index!=0&&index!=5&&index!=6&&index!=7&&index!=8&&index!=9&&index!=10){//If isnot the principal mesh.
			intersects = raycast.intersectObject(floors[index-1]);
			if(intersects.length!=0){
				var p=intersects[0].point;
				meshes[index].position.x=p.x+0.001;
				meshes[index].position.y=p.y+0.001;
				meshes[index].position.z=p.z+0.001;
			}
		}
		var min = 0.5;
		switch(index){
		case 0:{ //Cuando movemos el objeto principal.
			intersects = raycast.intersectObject(plane);
			if(intersects.length!=0){
				var p=intersects[0].point;
				meshes[0].position.x=p.x+0.001;
				meshes[0].position.y=p.y+0.001;
				meshes[0].position.z=p.z+0.001;
				xz.position.set(meshes[0].position.x,0.01,meshes[0].position.z);
				xy.position.set(meshes[0].position.x,meshes[0].position.y,0.01);
				yz.position.set(0.01,meshes[0].position.y,meshes[0].position.z);
				updateSizers();
				setOutlinePosition();
			}

			break;
		}
		//Cuando usamos las sombras.
			case 1:{//xz plane move.
				meshes[0].position.x=meshes[index].position.x;
				meshes[0].position.z=meshes[index].position.z;
				setOutlinePosition();
				meshes[2].position.x=meshes[index].position.x;
				meshes[3].position.z=meshes[index].position.z;
				updateSizers();
				break;
			}
			case 2:{//xy plane move.
				meshes[0].position.x=meshes[index].position.x;
				meshes[0].position.y=meshes[index].position.y;
				setOutlinePosition();
				meshes[1].position.x=meshes[index].position.x;
				meshes[3].position.y=meshes[index].position.y;
				updateSizers();
				break;
			}
			case 3:{//yz plane move.
				meshes[0].position.z=meshes[index].position.z;
				meshes[0].position.y=meshes[index].position.y;
				setOutlinePosition();
				meshes[1].position.z=meshes[index].position.z;
				meshes[2].position.y=meshes[index].position.y;
				updateSizers();
				break;
			}
			case 8:
			case 5:{//Escalamiento en X
				intersects = raycast.intersectObject(plane);
				if(intersects.length!=0){
					var p=intersects[0].point;
					v.set(p.x-meshes[0].position.x,p.y-meshes[0].position.y,p.z-meshes[0].position.z);
					v2.set((index<8)?1:-1,0,0);
					v2.applyQuaternion(meshes[0].quaternion);
					v.projectOnVector(v2);
					meshes[index].position.set(v.x+meshes[0].position.x,v.y+meshes[0].position.y,v.z+meshes[0].position.z);
					var scalex =(v.length()-sizeSizers/2)/(dx/2);
					meshes[0].scale.x=scalex<min?min:scalex;
					meshes[4].scale.x=meshes[0].scale.x*1.05;
					updateSizers();
				}
				break;
			}
			case 9:
			case 6:{//Escalamiento en Y
				intersects = raycast.intersectObject(plane);
				if(intersects.length!=0){
					var p=intersects[0].point;
					v.set(p.x-meshes[0].position.x,p.y-meshes[0].position.y,p.z-meshes[0].position.z);
					v2.set(0,(index<8)?1:-1,0);
					v2.applyQuaternion(meshes[0].quaternion);
					v.projectOnVector(v2);
					meshes[index].position.set(v.x+meshes[0].position.x,v.y+meshes[0].position.y,v.z+meshes[0].position.z);
					var scaley = (v.length()-sizeSizers/2)/(dy/2);
					meshes[0].scale.y= scaley<min?min:scaley;
					meshes[4].scale.y=meshes[0].scale.y*1.05;
					updateSizers();
				}
				break;
			}
			case 10:
			case 7:{//Escalamiento en Z

				intersects = raycast.intersectObject(plane);
				if(intersects.length!=0){
					var p=intersects[0].point;
					v.set(p.x-meshes[0].position.x,p.y-meshes[0].position.y,p.z-meshes[0].position.z);
					v2.set(0,0,(index<8)?1:-1);
					v2.applyQuaternion(meshes[0].quaternion);
					v.projectOnVector(v2);
					meshes[index].position.set(v.x+meshes[0].position.x,v.y+meshes[0].position.y,v.z+meshes[0].position.z);
					var scalez = (v.length()-sizeSizers/2)/(dz/2);
					meshes[0].scale.z=scalez<min?min:scalez;
					meshes[4].scale.z=meshes[0].scale.z*1.05;
					updateSizers();
				}
				break;
			}
		}
	}

	function round(n, d) // round 'n' to 'd' decimals
	{
		d = Math.pow(10, d);
		return Math.round(n * d) / d
	}
	//Get meshes function.
	this.getMeshes=function(){
		return meshes;
	}

	//Magic Function. Gandalf made it.
	this.isSelected=function(mesh){
		return meshes[0]==mesh;
	}

	//When the mesh is selected add the shadow planes and the outline to the scene.
	this.select=function(){
		scene.add(meshes[1]);
		scene.add(meshes[2]);
		scene.add(meshes[3]);
		scene.add(meshes[5]);
		scene.add(meshes[6]);
		scene.add(meshes[7]);
		scene.add(meshes[8]);
		scene.add(meshes[9]);
		scene.add(meshes[10]);
		setOutlinePosition();
		scene.add(outline);
	}

	//Remove all of them when is unselected.
	this.unselect=function(){
		scene.remove(meshes[1]);
		scene.remove(meshes[2]);
		scene.remove(meshes[3]);
		scene.remove(meshes[5]);
		scene.remove(meshes[6]);
		scene.remove(meshes[7]);
		scene.remove(meshes[8]);
		scene.remove(meshes[9]);
		scene.remove(meshes[10]);
		scene.remove(outline);
	}

}