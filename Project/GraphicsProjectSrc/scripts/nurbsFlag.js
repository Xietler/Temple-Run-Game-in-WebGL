/**
 * @author hahahaha123567
 **/

NURBSFlag = function (x, y, z, size, angle)
{
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;
    this.angle = angle;

    var nsControlPoints = [
        [
            new THREE.Vector4 ( -2, 3, 0, 1 ),
            new THREE.Vector4 ( -2, 2, 0, 1 ),
            new THREE.Vector4 ( -2, 1, 0, 1 ),
            new THREE.Vector4 ( -2, 0, 0, 1 )
        ],
        [
            new THREE.Vector4 ( -0.5, 3, 0, 1 ),
            new THREE.Vector4 ( -0.5, 2, 0, 1 ),
            new THREE.Vector4 ( -0.5, 1, 0, 1 ),
            new THREE.Vector4 ( -0.5, 0, 0, 1 )
        ],
        [
            new THREE.Vector4 ( 1, 3, 0, 1 ),
            new THREE.Vector4 ( 1, 2, 0, 1 ),
            new THREE.Vector4 ( 1, 1, 0, 1 ),
            new THREE.Vector4 ( 1, 0, 0, 1 )
        ],
        [
            new THREE.Vector4 ( 2.5, 3, 0.5, 2 ),
            new THREE.Vector4 ( 2.5, 2, 0, 1 ),
            new THREE.Vector4 ( 2.5, 1, 0, 1 ),
            new THREE.Vector4 ( 2.5, 0, -1, 1 )
        ]
    ];
    var degree1 = 3;
    var degree2 = 3;
    var knots1 = [0, 0, 0, 0, 1, 1, 1, 1];
    var knots2 = [0, 0, 0, 0, 1, 1, 1, 1];
    var nurbsSurface = new THREE.NURBSSurface(degree1, degree2, knots1, knots2, nsControlPoints);

    var map = new THREE.TextureLoader().load( 'GraphicsProjectsrc/images/flag.jpg' );
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 16;

    function getSurfacePoint(u, v) {
        return nurbsSurface.getPoint(u, v);
    }

    var geometry = new THREE.ParametricBufferGeometry( getSurfacePoint, 20, 20 );
    var material = new THREE.MeshLambertMaterial( { 
        map: map,
        side: THREE.DoubleSide 
    } );
    console.log(material.map)
    var object = new THREE.Mesh( geometry, material );

    var geo = new THREE.Geometry();
    geo.vertices.push(
        new THREE.Vector3( -2, 3, 0 ),
        new THREE.Vector3( -2, 0, 0 ),
        new THREE.Vector3( -2, -3, 0 )
    );
    var mat = new THREE.LineBasicMaterial({
        color: 0x000000
    })
    var line = new THREE.Line(geo, mat);

    var group = new THREE.Object3D();
    group.add(object);
    group.add(line);
    group.position.set(x, y, z);
    group.scale.set(size, size, size);
    group.rotation.y = angle/180*Math.PI;

    return group;
}
