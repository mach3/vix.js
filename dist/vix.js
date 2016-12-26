/*!
 * Vix.js
 * ---------------------------
 * @version 0.1.1 (2016-12-26)
 * @license MIT
 * @author mach3<mach3@mach3.jp>
 */
!function($){

	var Vix = function(el, options){
		this.el = $(el);
		this.options = $.extend({}, this._options, options);
		this.name = this.el.data("view");

		if(! this.name){
			console.error("No Template");
			return;
		}

		Vix.__instanceStack__.push(this);
	};

	$.extend(Vix.prototype, {

		EVENT_RENDERED: "rendered",

		el: null,
		name: null,
		data: null,
		process: null,
		options: null,

		_options: {
			templatePath: "templates",
			templateExt: ".html",
			api: window,
			done: window,
			engine: "handlebars" // "lodash" | "mustache" | "handlebars"
		},

		render: function(force, override){
			var d = this.el.data();

			if(! this.name) return;

			if(! d.rendered){
				this.el.on(this.EVENT_RENDERED, this.fetchCallback(d));
			}

			if(! d.rendered || force){
				$.when(
					this.fetchTemplate(d),
					this.fetchAPI(d, override)
				)
				.done(this.postRender(!! d.rendered, force, override));
				this.el.data("rendered", true);
			}
		},

		postRender: function(rendered, force, override){
			return (function(){
				var con = $("<div>").append(
					Vix.template(this.name)(this.data)
				);
				con.find("[data-view]").vix(force, override, this.options);
				if(rendered && force){
					this.el.html("");
				}
				con.contents().appendTo(this.el);
				this.el.trigger(this.EVENT_RENDERED);
			}).bind(this);
		},

		fetchTemplate: function(d){
			var df = $.Deferred(), self = this;

			if(this.name in Vix.__templates__){
				df.resolve();
			} else {
				$.ajax({
					url: [
						this.options.templatePath,
						"/",
						this.name,
						this.options.templateExt
					].join(""),
					dataType: "text"
				})
				.done(function(data){
					Vix.template(
						self.name,
						Vix.compile(data, self.options.engine)
					);
					df.resolve();
				});
			}
			return df.promise();
		},

		setData: function(data, override){
			this.data = $.extend(true, {}, data, override);
		},

		fetchAPI: function(d, override){
			var df, api, r, self = this;

			df = $.Deferred();
			api = this.dig(d.api) || this.dig(this.name);

			if($.isFunction(api)){
				r = api.apply(this, [this.el.get(0), this.el.data(), override]);

				if(r === void 0){
					return df.resolve();
				}
				if(! $.isFunction(r.then)){
					this.setData(r, override);
					return df.resolve();
				}
				r.then(function(data){
					self.setData(
						($.type(data) === "string") ? $.parseJSON(data) : data,
						override
					);
					df.resolve();
				});
			} else {
				this.setData(override);
				return df.resolve();
			}

			return df.promise();
		},

		fetchCallback: function(d){
			return this.dig(
				("done" in d) ? d.done : this.name,
				this.options.done
			) || function(){};
		},

		dig: function(path, o){
			path = path || "";
			o = o || this.options.api;
			path.split(".").forEach(function(name){
				if(o === void 0) return;
				o = o[name];
			});
			return o;
		}

	});

	$.extend(Vix, {

		__templates__: {},
		__instanceKey__: "__VixInstance__",
		__instanceStack__: [],

		getInstance: function(name){
			// remove garbage
			this.__instanceStack__ = this.__instanceStack__
			.filter(function(item){
				return !! item.el.closest("body").length;
			});
			return (void 0 === name) ? this.__instanceStack__
			: this.__instanceStack__.filter(function(item){
				return item.name === name;
			});
		},

		config: function(key, value){
			var type = $.type(key);
			if(void 0 === key){
				return this.prototype._options;
			}
			if(type === "string"){
				if(arguments.length === 1){
					return this.prototype._options[key];
				}
				this.prototype._options[key] = value;
				return this;
			}
			if(type === "object"){
				$.extend(true, this.prototype._options, key);
			}
			return this;
		},

		compile: function(tmpl, engine){
			engine = engine || this.config("engine");
			switch(engine){
				case "lodash": return _.template(tmpl);
				case "handlebars": return Handlebars.compile(tmpl);
				case "mustache":
					return function(data){
						return Mustache.render(tmpl, data);
					};
				default: break;
			}
			return $.noop;
		},

		template: function(key, render){
			var type = $.type(key), self = this;
			if(void 0 === key){
				return this.__templates__;
			}
			if(type === "string"){
				if(arguments.length === 1){
					return this.__templates__[key];
				}
				render = ! $.isFunction(render) ? this.compile(render) : render;
				this.__templates__[key] = render;
				return this;
			}
			if(type === "object"){
				$.each(key, function(k, r){
					self.template(k, r);
				});
				return this;
			}
			return void 0;
		},

		render: function(){
			var self = this;
			$("script[data-template]").each(function(){
				var el = $(this);
				self.template(el.data("template"), el.html());
			});
			$("[data-view]").vix();
			return this;
		},

		refresh: function(name, override){
			this.getInstance(name).forEach(function(i){
				i.render(true, override);
			});
			return this;
		},

		on: function(type, callback){
			$(document).on(type, "[data-view]", callback);
			return this;
		}
	});


	// Expose

	$.fn.vix = function(force, override, options){
		var key = Vix.__instanceKey__;

		force = !! force;
		override = (override === void 0) ? {} : override;
		options = (options === void 0) ? {} : options;

		this.each(function(){
			var p = this[key] || new Vix(this, options);
			p.render(force, override);
			this[key] = p;
		});
		return this;
	};

	if (typeof module === "object" && typeof module.exports === "object"){
		module.exports = Vix;
	} else {
		window.Vix = Vix;
	}

}(jQuery);

