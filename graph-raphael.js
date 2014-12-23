/*!
 * GraphRaphael v0.1.0 (https://github.com/lastseal/graph-raphael)
 * Copyright 2011-2014 Lastseal SpA.
 * Licensed under MIT (https://github.com/lastseal/graph-raphael/blob/master/LICENSE)
 */

!(function (exports){

    var Node = function(data, template, dx, dy) {

        this._properties = {};
        this._data = [];
        this._children = [];
        this._objects = null;
        this._links = [];

        this.dx = dx;
        this.dy = dy;

        this.x = dx;
        this.y = dy;

        this.width = 0;
        this.height = 0;

        for (var i=0; i<template.length; i++) {

            var obj = template[i];

            if (i === 0 && obj.type === "rect") {
                this.x += obj.width / 2;
                this.y += obj.height / 2;

                this.width = obj.width;
                this.height = obj.height;
            }
            else if (i === 0 && obj.type === "circle") {
                this.x += obj.r;
                this.y += obj.r;

                this.width = 2 * obj.r;
                this.height = 2 * obj.r;
            }
            else if (i === 0 && obj.type === "path") {
                           
            }

            var element = {};

            for (var key in obj) {

                if (typeof obj[key] === "object") {
                    
                    /* El objeto es un arreglo de dos elementos. 
                     * El primer elemento es el nombre de la 
                     * propiedad y el segundo son los atributos
                     * de la propiedad. Tiene la forma:
                     *
                     * obj[key] = ["nombre", {"default": VALOR}] 
                     */

                    var name = obj[key][0];
                    
                    if (name in data) {
                        element[key] = data[name]
                    }
                    else if (obj[key].length > 1) {
                        element[key] = obj[key][1]['default']
                    }
                    else {
                        throw "it is necesary a default value for property", name
                    }

                    this._properties[name] = {"name": key, "index": i};
                }
                else {
                    element[key] = obj[key];
                }
            }

            this._data.push(element);
        }
    }

    Node.prototype.addChild = function(node) {

        this._children.push(node);
    }

    Node.prototype.render = function(paper, dx, dy) {

        var x1 = dx + this.x + this.width/2;
        var y1 = dy + this.y;

        for (var i=0; i<this._children.length; i++) {
            var node = this._children[i];

            var x2 = dx + node.x - this.width/2;
            var y2 = dy + node.y;

            var link;

            if (y1 == y2) {

                link = paper.path('M'+x1+','+y1+'H'+x2);
            }
            else {
                var p = (x2+x1)/2

                link = paper.path('M'+x1+','+y1+'H'+p+'V'+y2+'H'+x2);
            }

            link.attr('stroke-width', 2);
            //link.attr('stroke-dasharray', '-');
            link.attr('arrow-end', 'classic');

            this._links.push(link);
        }

        this._objects = paper.add( this._data );

        var that = this;

        this._objects.forEach(function(item) {
            item.translate(dx+that.dx, dy+that.dy);
        });
    }

    Node.prototype.update = function(properties) {

        if (this._objects == null) {
            return;
        }

        for (var name in properties) {

            if (name in this._properties) {

                var p = this._properties[name];

                this._objects[p.index].attr(p.name, properties[name]);
            }
        }
    }

    var Tree = function(config) {

        this._nodes = {}
        this._edges = []
        this._paper = null
        this._width = 800
        this._height = 600
        this._nodeTemplate = [{

            "type": "rect",
            "height": 10,
            "width": 10,
            "fill": "#FFFFFF"
        },{
            "type": "text",
            "x": 5,
            "y": 5,
            "text": ["id", {"default": ""}]
        }]

        if ( !("model" in config) ) {
            throw "model is mandatory in Graph";
        }

        if ("nodeTemplate" in config) {
            this._nodeTemplate = config.nodeTemplate;
        }

        var max_dx = 0;
        var max_dy = 0;

        for (var i=0; i<config.model.length; i++) {

            var e = config.model[i];

            var dx = "dx" in e ? e.dx : 0;
            var dy = "dy" in e ? e.dy : 0;

            max_dx = dx > max_dx ? dx : max_dx
            max_dy = dy > max_dy ? dy : max_dy

            this._nodes[e.id] = new Node(e, this._nodeTemplate, dx, dy);

            if ("parent" in e && e.parent in this._nodes) {
                this._nodes[e.parent].addChild(this._nodes[e.id]);
            }
        }

        /**
         * Se calcula el 'width' y 'height' del canvas
         */
        if (this._nodeTemplate[0].type == "rect") {
            this._width = this._nodeTemplate[0].width + max_dx;
            this._height = this._nodeTemplate[0].height + max_dy;
        }
    }
    
    Tree.prototype.renderTo = function(container, options) {

        if (typeof options == "undefined") {
            options = {dx: 0, dy:0, width: this._width, height: this._height};
        }

        this._paper = Raphael(container, options.width, options.height);
        /*
        this._paper.setViewBox(0, 0, width, height, true);
        this._paper.setSize(window.innerWidth, window.innerHeight);
        */
        for (var key in this._nodes) {
            this._nodes[key].render(this._paper, options.dx, options.dy);
        }
    }
    

    Tree.prototype.update = function(properties) {

        if (this._paper == null) {
            return;
        }

        if ( !("id" in properties) ) {
            throw "id is mandatory in properties", properties;
        }

        this._nodes[properties.id].update(properties);
    }

    exports.graph = {

        Tree: function(config) {
            return new Tree(config)
        }
    }

}(window));
