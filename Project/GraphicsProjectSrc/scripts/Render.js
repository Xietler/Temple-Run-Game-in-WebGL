ZERO.Mesh = ZERO.Class(
    {
        canvas : null,
        texture : null,
    
        renderMethod : null, //渲染方式，默认为 gl.TRIANGLES.
    
        _modelMatrix : null,  //4x4模型矩阵，内含Mesh所包含模型所进行的所有矩阵转换操作。
    
        _hotspot: null,
    
        _program : null,
        _context : null,
        _textureRelease : true,
        
        _meshVBO : null,
        _meshIndexVBO : null,
        _textureVBO : null,
        _vboNoRelease : false,
        _meshIndexSize : null,
        _vertexDataType : null,         //顶点数据类型，默认为 gl.FLOAT
        _meshIndexDataType : null,    //索引数据类型，默认为 gl.UNSIGNED_SHORT
        _meshDataSize : null,     //每个顶点所包含的分量，可选值为1,2,3,4，默认4
        _texDataSize : null,      //每个纹理坐标所包含的分量，同上。
        //定义attrib location
        _vertAttribLoc : 0,
        _texAttribLoc : 1,
    
        //缓存一些可能用到的location
        _mvpLoc : null,
        _textureLoc : null,
    
        initialize : function(canvas, ctx, vsh, fsh)
        {
            // this.pos = new ZERO.Vec3(0, 0, 0);
            // this.scaling = new ZERO.Vec3(1, 1, 1);
            // this._hotspot = new ZERO.Vec3(0, 0, 0);
            this._modelMatrix = ZERO.mat4Identity();
    
            this.canvas = canvas;
            if(!canvas)
            {
                console.error("Invalid Params while creating ZERO.Mesh!");
            }
            var gl = ctx || ZERO.webgl || this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            this._context = gl;
    
            if(!this.renderMethod)
            {
                this.renderMethod = gl.TRIANGLES;
            }
    
            if(vsh && fsh)
            {
                this._initProgram(vsh, fsh);
            }
            else
            {
                if(!ZERO.Mesh.VertexShader)
                    ZERO.Mesh.VertexShader = ZERO.requestTextByURL(ZERO.Mesh.ShaderDir + "ZEROMesh.vsh.txt");
                if(!ZERO.Mesh.FragmentShader)
                    ZERO.Mesh.FragmentShader = ZERO.requestTextByURL(ZERO.Mesh.ShaderDir + "ZEROMesh.fsh.txt");
                this._initProgram(ZERO.Mesh.VertexShader, ZERO.Mesh.FragmentShader);
            }
            this._meshVBO = gl.createBuffer();
            this._meshIndexVBO = gl.createBuffer();
            this._textureVBO = gl.createBuffer();
            this._vertexDataType = gl.FLOAT;
            this._meshIndexDataType = gl.UNSIGNED_SHORT;
        },
    
        release : function()
        {
            var gl = this._context;
            if(this.texture && this.texture.release)
                this.texture.release();
            this._program.release();
    
            gl.deleteBuffer(this._meshVBO);
            gl.deleteBuffer(this._meshIndexVBO);
            gl.deleteBuffer(this._textureVBO);
    
            this.canvas = this.texture = this._program = this._context = null;
        },
    
        initSprite : function(vertexArr, vertexDataSize, texArr, texDataSize, indexArr, tex, noRelease)
        {		
            var gl = this._context;
            var vertData = vertexArr instanceof Array ? new Float32Array(vertexArr) : vertexArr;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._meshVBO);
            gl.bufferData(gl.ARRAY_BUFFER, vertData, gl.STATIC_DRAW);
    
            var texData = texArr instanceof Array ? new Float32Array(texArr) : texArr;
            gl.bindBuffer(gl.ARRAY_BUFFER, this._textureVBO);
            gl.bufferData(gl.ARRAY_BUFFER, texData, gl.STATIC_DRAW);
    
            var indexData = indexArr instanceof Array ? new Uint16Array(indexArr) : indexArr;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshIndexVBO);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    
            this._meshIndexSize = indexArr.length;
            this._meshDataSize = vertexDataSize;
            this._texDataSize = texDataSize;
    
            if(tex)
                this.initTexture(tex, noRelease);
            ZERO.checkGLErr("ZERO.Mesh.initSprite", gl);
        },

        initBuffer : function(vertBuffer, vertexDataSize, texBuffer, texDataSize, vertIndexBuffer, noRelease)
        {
            this._meshVBO = vertBuffer;
            this._textureVBO = texBuffer;
            this._meshIndexVBO = vertIndexBuffer;
            this._meshDataSize = vertexDataSize;
            this._texDataSize = texDataSize;
            this._vboNoRelease = !!noRelease;
        },
    
        initTexture : function(tex, noRelease)
        {
            if(!tex)
                return false;
    
            if(tex instanceof ZERO.Texture2D)
            {
                this._textureRelease = !noRelease;
                this.texture = tex;
            }
            else
            {
                this._textureRelease = true;
                this.texture = new ZERO.Texture2D(this._context, noRelease);
                this.texture.initWithImg(tex);
            }
            return true;
        },

        render : function(mvp)
        {
            var matrix = ZERO.mat4Mul(mvp, this._modelMatrix);
            var gl = this._context;
            var program = this._program;
            program.bind();
            gl.uniformMatrix4fv(this._mvpLoc, false, matrix.data);
    
            this.texture.bindToIndex(1); 
            gl.uniform1i(this._textureLoc, 1);
    
            gl.bindBuffer(gl.ARRAY_BUFFER, this._meshVBO);
            gl.enableVertexAttribArray(this._vertAttribLoc);
            gl.vertexAttribPointer(this._vertAttribLoc, this._meshDataSize, this._vertexDataType, false, 0, 0)
    
            gl.bindBuffer(gl.ARRAY_BUFFER, this._textureVBO);
            gl.enableVertexAttribArray(this._texAttribLoc);
            gl.vertexAttribPointer(this._texAttribLoc, this._texDataSize, this._vertexDataType, false, 0, 0);
    
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._meshIndexVBO);
            gl.drawElements(this.renderMethod, this._meshIndexSize, this._meshIndexDataType, 0);
        },
    
        translate : function(tx, ty, tz)
        {
            this.translateX(tx);
            this.translateY(ty);
            this.translateZ(tz);
        },
    
        translateX : function(tx)
        {
            this._modelMatrix.translateX(tx);
        },
    
        translateY : function(ty)
        {
            this._modelMatrix.translateY(ty);
        },
    
        translateZ : function(tz)
        {
            this._modelMatrix.translateZ(tz);
        },
    
        scale : function(sx, sy, sz)
        {
            this.scaleX(sx);
            this.scaleY(sy);
            this.scaleZ(sz);
        },
    
        scaleX : function(sx)
        {
            this._modelMatrix.scaleX(sx);
        },
    
        scaleY : function(sy)
        {
            this._modelMatrix.scaleY(sy);
        },
    
        scaleZ : function(sz)
        {
            this._modelMatrix.scaleZ(sz);
        },
    
        rotate : function(rad, x, y, z)
        {
            this._modelMatrix.rotate(rad, x, y, z);
        },
    
        rotateX : function(rad)
        {
            this._modelMatrix.rotateX(rad);
        },
    
        rotateY : function(rad)
        {
            this._modelMatrix.rotateY(rad);
        },
    
        rotateZ : function(rad)
        {
            this._modelMatrix.rotateZ(rad);
        },
    
        _initProgram : function(vsh, fsh)
        {
            var gl = this._context;
            var program = new ZERO.Program(gl);
            this._program = program;
    
            program.initWithShaderCode(vsh, fsh);
    
            program.bindAttribLocation(ZERO.Mesh.AttribVertexName, this._vertAttribLoc);
            program.bindAttribLocation(ZERO.Mesh.AttribTextureName, this._texAttribLoc);
    
            if(!program.link())
            {
                console.error("ZERO.Mesh : Program link Failed!");
                return false;
            }
    
            program.bind();
    
            this._mvpLoc = program.uniformLocation(ZERO.Mesh.MVPName);
            this._textureLoc = program.uniformLocation(ZERO.Mesh.TextureName);
            if(!(this._mvpLoc && this._textureLoc))
            {
                console.warn("ZERO.Mesh : Not all uniform locations are correct!");
            }
    
            ZERO.checkGLErr("ZERO.Mesh - init program", gl);
            return true;
        }
    
    
    
    });
    
    ZERO.Mesh.VertexShader = "varying vec2 vTextureCoord;attribute vec4 aPosition;attribute vec4 aTexCoord;uniform mat4 mvp;void main(){gl_Position = mvp * aPosition;vTextureCoord = aTexCoord.st;}";
    
    ZERO.Mesh.FragmentShader = "precision mediump float;varying vec2 vTextureCoord;uniform sampler2D sTexture;void main(){gl_FragColor = texture2D(sTexture,vTextureCoord);}";
    
    ZERO.Mesh.AttribVertexName = "aPosition";
    ZERO.Mesh.AttribTextureName = "aTexCoord";
    ZERO.Mesh.TextureName = "sTexture";
    ZERO.Mesh.MVPName = "mvp";