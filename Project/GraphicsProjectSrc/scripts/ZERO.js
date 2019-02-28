"use strict";

ZERO.webgl = null;

ZERO.bindContext = function(ctx)
{
	ZERO.webgl = ctx;
}

ZERO.Texture2D = ZERO.Class(
{
	texture : null,
	width : 0,
	height : 0,
	_context : null,
	_conf : {
		TEXTURE_MIN_FILTER : 'NEAREST',
		TEXTURE_MAG_FILTER : 'NEAREST',
		TEXTURE_WRAP_S : 'CLAMP_TO_EDGE',
		TEXTURE_WRAP_T : 'CLAMP_TO_EDGE',
	},

	_shouldRelease : true,

	initialize : function(ctx, config)
	{
		this._context = ctx || ZERO.webgl;
		if(config)
			ZERO.extend(this._conf, config);
	},

	bindContext : function(ctx)
	{
		this._context = ctx || ZERO.webgl;
	},

	initWithTexture : function(texObj, w, h, noRelease, ctx)
	{
		this.texture = texObj;
		this.width = w || texObj.width;
		this.height = h || texObj.height;
		this._shouldRelease = !noRelease;
		this._context = ctx || ZERO.webgl || this._context;
	},

	initWithTag : function(tagID)
	{
		this.initWithImg(ZERO.ID(tagID));
	},

	initWithImg : function(imageObj)
	{
		if(!imageObj)
 			return;
 		var webgl = this._context;
		this.width = imageObj.width;
 		this.height = imageObj.height;
 		this.texture = webgl.createTexture();
 		webgl.bindTexture(webgl.TEXTURE_2D, this.texture);
 		webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, imageObj);

 		webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl[this._conf.TEXTURE_MIN_FILTER]);
 		webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl[this._conf.TEXTURE_MAG_FILTER]);
 		webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl[this._conf.TEXTURE_WRAP_S]);
 		webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl[this._conf.TEXTURE_WRAP_T]);
	},

	bindToIndex : function(textureIndex)
	{
		var webgl = this._context;
		webgl.activeTexture(webgl.TEXTURE0 + textureIndex);
		webgl.bindTexture(webgl.TEXTURE_2D, this.texture);
	},

	release : function()
	{
		var webgl = this._context || ZERO.webgl;

		if(this.texture && webgl && this._shouldRelease)
 		{
 			webgl.deleteTexture(this.texture);
 		}

 		this.texture = null;
 		this._context = null;
	}
});

ZERO.Framebuffer = ZERO.Class(
{
	framebuffer : null,
	_context : null,

	initialize : function(ctx)
	{
		this._context = ctx || ZERO.webgl;
		this.framebuffer = this._context.createFramebuffer();
	},

	release : function()
	{
		this._context.deleteFramebuffer(this.framebuffer);
		this.framebuffer = null;
		this._context = null;
	},

	bind : function()
	{
		this._context.bindFramebuffer(this._context.FRAMEBUFFER, this.framebuffer);
	},

	bindTexture2D : function(texObj, attachment)
	{
		this.bind();
		var webgl = this._context;
		var attach = isNaN(attachment) ? attachment : webgl[attachment];
		webgl.framebufferTexture2D(webgl.FRAMEBUFFER, webgl[attach], webgl.TEXTURE_2D, texObj, 0);

		if(webgl.checkFramebufferStatus(webgl.FRAMEBUFFER) != webgl.FRAMEBUFFER_COMPLETE)
 		{
		    console.error("ZERO.Framebuffer - bindTexture2D - Frame buffer is not completed.");
 		}
	}
});

ZERO.Shader = ZERO.Class(
{
	shaderType : null,
	shader : null,
	_context : null,

	initialize : function(ctx, shaderType, shaderCode)
	{
		var webgl = ctx || ZERO.webgl;
		this._context = webgl;
		this.shaderType = typeof shaderType == 'string' ? webgl[shaderType] : shaderType;

		this.shader = webgl.createShader(this.shaderType);

		if(shaderCode)
		{
			loadShaderCode(shaderCode);
		}
	},

	release : function()
	{
		this._context.deleteShader(this.shader);
		this.shader = this.shaderType = null;
	},

	loadShaderCode : function(shaderCode)
	{
		var webgl = this._context;
		webgl.shaderSource(this.shader, shaderCode);
		webgl.compileShader(this.shader);
		if (!webgl.getShaderParameter(this.shader, webgl.COMPILE_STATUS))
		{
		    console.error(webgl.getShaderInfoLog(this.shader), this.shaderType)
			return false;
		}
		return true;
	},

	loadShaderFromTag : function(tagID)
	{
		return this.loadShaderCode(ZERO.getContentByID(tagID));
	},

});

ZERO.Program = ZERO.Class(
{
	_context : null,
	vertShader : null,
	fragShader : null,
	program : null,

	initialize : function(ctx)
	{
		var webgl = ctx || ZERO.webgl;
		this._context = webgl;
		this.program = webgl.createProgram();
		this.vertShader = new ZERO.Shader(webgl, webgl.VERTEX_SHADER);
		this.fragShader = new ZERO.Shader(webgl, webgl.FRAGMENT_SHADER);
	},

	release : function()
	{
		this._context.deleteProgram(this.program);
		this.vertShader.release();
		this.fragShader.release();
		this._context = this.vertShader = this.fragShader = this.program = null;
	},

	initWithShaderCode : function(vsh, fsh)
	{
		if(!(vsh && fsh))
			return false;
		return this.vertShader.loadShaderCode(vsh) &&
				this.fragShader.loadShaderCode(fsh);
	},

	initWithShaderTag : function(vshTag, fshTag)
	{
		if(!(vsh && fsh))
			return false;
		return this.vertShader.loadShaderFromTag(vshTag) &&
				this.fragShader.loadShaderFromTag(fshTag);
	},

	loadFragmentShaderCode : function(shaderCode)
	{
		return this.fragShader.loadShaderCode(shaderCode);
	},

	loadVertexShaderCode : function(shaderCode)
	{
		return this.vertShader.loadShaderCode(shaderCode);
	},

	loadFragmentShaderFromTag : function(shaderCode)
	{
		return this.fragShader.loadShaderFromTag(shaderCode);
	},

	loadVertexShaderFromTag : function(shaderCode)
	{
		return this.vertShader.loadShaderFromTag(shaderCode);
	},

	link : function()
	{
		var webgl = this._context;
		webgl.attachShader(this.program, this.vertShader.shader);
		webgl.attachShader(this.program, this.fragShader.shader);
		webgl.linkProgram(this.program);
		if (!webgl.getProgramParameter(this.program, webgl.LINK_STATUS))
		{
		    console.error(webgl.getProgramInfoLog(this.program));
			return false;
		}
		return true;
	},

	bind : function()
	{
		this._context.useProgram(this.program);
	},

	uniformLocation : function(uniformName)
	{
		var loc = this._context.getUniformLocation(this.program, uniformName);
		if(!loc)
		{
		    console.error("Uniform Name " + uniformName + " doesnot exist!");
		}
		return loc;
	},

	attribLocation : function(attribName)
	{
		return this._context.getAttribLocation(this.program, attribName);
	},

	//Should be called before "bind()"
	bindAttribLocation : function(attribName, location)
	{
		this._context.bindAttribLocation(this.program, location, attribName);
	},

	sendUniform1f : function(uniformName, v1)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform1f(loc, v1);
	},

	sendUniform2f : function(uniformName, v1, v2)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform2f(loc, v1, v2);
	},

	sendUniform3f : function(uniformName, v1, v2, v3)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform3f(loc, v1, v2, v3);
	},

	sendUniform4f : function(uniformName, v1, v2, v3, v4)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform4f(loc, v1, v2, v3, v4);
	},

	sendUniform1i : function(uniformName, v1)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform1i(loc, v1);
	},

	sendUniform2i : function(uniformName, v1, v2)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform2i(loc, v1, v2);
	},

	sendUniform3i : function(uniformName, v1, v2, v3)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform3i(loc, v1, v2, v3);
	},

	sendUniform4i : function(uniformName, v1, v2, v3, v4)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniform4i(loc, v1, v2, v3, v4);
	},

	sendUniformMat2 : function(uniformName, transpose, matrix)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniformMatrix2fv(loc, transpose, matrix);
	},

	sendUniformMat3 : function(uniformName, transpose, matrix)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniformMatrix3fv(loc, transpose, matrix);
	},

	sendUniformMat4 : function(uniformName, transpose, matrix)
	{
		var loc = this.uniformLocation(uniformName);
		this._context.uniformMatrix4fv(loc, transpose, matrix);
	}

});