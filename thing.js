function Thing(_mesh,_scene,_floors){
	//Why?
	var floors=_floors;
	var meshes=[];
	var scene=_scene;
	var box = new THREE.Box3().setFromObject(_mesh);
	var dx=box.max.x-box.min.x;
	var dy=box.max.y-box.min.y;
	var dz=box.max.z-box.min.z;
	var material= new THREE.MeshBasicMaterial( {color:'red', side:THREE.DoubleSide, transparent:true, opacity:0.5} );
	//Shadow xz of the mesh.
	var xz=new THREE.Mesh( new THREE.PlaneBufferGeometry( dx, dz, 1, 1 ), material );
	//Shadow xy of the mesh.
	var xy=new THREE.Mesh( new THREE.PlaneBufferGeometry( dx, dy, 1, 1 ), material );
	//Shadow yz of the mesh.
	var yz=new THREE.Mesh( new THREE.PlaneBufferGeometry( dy, dz, 1, 1 ), material );
	//Create a ilusion about the selected item creating a backside object with a fluorescent color, then resize for making bigger.
	var outline;
	
	yz.position.set(0.01,_mesh.position.y,_mesh.position.z);
	yz.rotation.y=Math.PI/2
	
	xz.position.set(_mesh.position.x,0.01,_mesh.position.z);
	xz.rotation.x=Math.PI/2;
	
	xy.position.set(_mesh.position.x,_mesh.position.y,0.01);


	meshes[meshes.length]=_mesh;
	meshes[meshes.length]=xz;
	meshes[meshes.length]=xy;
	meshes[meshes.length]=yz;
	
	outline = new THREE.Mesh( meshes[0].geometry, new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.BackSide } ) );
	outline.scale.multiplyScalar(1.05);
	meshes[meshes.length]=outline;
	this.outlineOrientation=null;
	this.interpoint=null;



	//Just add the first mesh.
	scene.add(meshes[0]);

	//Function that make the outline mesh follow the principal mesh.
	var setOutlinePosition=function(){
		outline.position.x = meshes[0].position.x;
		outline.position.y = meshes[0].position.y;
		outline.position.z = meshes[0].position.z;
	}

	this.moveTo=function(index,raycast,plane){
		if(index!=0){//If isnot the principal mesh.
			intersects = raycast.intersectObject(floors[index-1]);
			if(intersects.length!=0){
				var p=intersects[0].point;
				meshes[index].position.x=p.x+0.001;
				meshes[index].position.y=p.y+0.001;
				meshes[index].position.z=p.z+0.001;
			}
		}
		switch(index){
		case 0:{ //First item move.
			intersects = raycast.intersectObject(plane);
			if(intersects.length!=0){
				var p=intersects[0].point;
				meshes[0].position.x=p.x+0.001;
				meshes[0].position.y=p.y+0.001;
				meshes[0].position.z=p.z+0.001;
				xz.position.set(meshes[0].position.x,0.01,meshes[0].position.z);
				xy.position.set(meshes[0].position.x,meshes[0].position.y,0.01);
				yz.position.set(0.01,meshes[0].position.y,meshes[0].position.z);
				setOutlinePosition();
			}

			break;
			}
			case 1:{//xz plane move.
				meshes[0].position.x=meshes[index].position.x;
				meshes[0].position.z=meshes[index].position.z;
				setOutlinePosition();
				meshes[2].position.x=meshes[index].position.x;
				meshes[3].position.z=meshes[index].position.z;
				break;
			}
			case 2:{//xy plane move.
				meshes[0].position.x=meshes[index].position.x;
				meshes[0].position.y=meshes[index].position.y;
				setOutlinePosition();
				meshes[1].position.x=meshes[index].position.x;
				meshes[3].position.y=meshes[index].position.y;
				break;
			}
			case 3:{//yz plane move.
				meshes[0].position.z=meshes[index].position.z;
				meshes[0].position.y=meshes[index].position.y;
				setOutlinePosition();
				meshes[1].position.z=meshes[index].position.z;
				meshes[2].position.y=meshes[index].position.y;
				break;
			}
			case 4:{//Resize with the outline.	
			intersects = raycast.intersectObject(plane);
			if(intersects.length!=0){
				var p=intersects[0].point;
			p=new THREE.Vector3(intersects[0].point.x-meshes[0].position.x,intersects[0].point.y-meshes[0].position.y,intersects[0].point.z-meshes[0].position.z);	
			//p=p.projectOnVector(this.outlineOrientation);
			var p2=new THREE.Vector3(this.interpoint.x-meshes[0].position.x,this.interpoint.y-meshes[0].position.y,this.interpoint.z-meshes[0].position.z);
			var box = new THREE.Box3().setFromObject(meshes[0]);
			$.notify("p2:"+round(p.x,2)+","+round(p2.y,2)+","+round(p2.z,2),{autoHide:false});
			meshes[0].scale.x=(p.x)*this.outlineOrientation.x/(2*(box.max.x-box.min.x));
			meshes[0].scale.y=(p.y)*this.outlineOrientation.y/(2*(box.max.y-box.min.y));
			meshes[0].scale.z=(p.z)*this.outlineOrientation.z/(2*(box.max.z-box.min.z));
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

	//Magic Function.
	this.isSelected=function(mesh){
		return meshes[0]==mesh;
	}

	//When the mesh is selected add the shadow planes and the outline to the scene.
	this.select=function(){
		scene.add(meshes[1]);
		scene.add(meshes[2]);
		scene.add(meshes[3]);
		setOutlinePosition();
		scene.add(outline);
	}

	//Remove all of them when is unselected.
	this.unselect=function(){
		scene.remove(meshes[1]);
		scene.remove(meshes[2]);
		scene.remove(meshes[3]);
		scene.remove(outline);
	}

}