
# Vix.js

シンプルなビューミキサーライブラリ。

## 機能

- テンプレートエンジンは lodash（EJS）, mustache, handlebars をサポート
- コンパイルしたテンプレートを名前で管理
- Ajaxでのテンプレート取得と、プリコンパイルに対応

## シンプルな使用例

### HTML:

	<header data-view="header" data-api="header"></header>

	<script type="text/template" data-template="header">
		<h1>{{title}}</h1>
		<p>{{description}}</p>
	</script>

* data-view 属性にビューの名前を設定
* data-api 属性にデータを渡す関数名を設定
* script[data-template] にテンプレートを記述

### JavaScript:

	Vix.config({
		engine: "handlebars",
		api: {
			header: function(){
				return {
					title: "Hello, World !",
					description: "ホームページへようこそ"
				}
			}
		}
	})
	.render();

* config() で使用するテンプレートエンジンと、apiの関数リストを設定
* render() でページ内のテンプレートをコンパイルし、描画

### Output:
	
	<header data-view="header" data-api="header">
		<h1>Hello, World !</h1>
		<p>ホームページへようこそ</p>
	</header>


## テンプレートの宣言

テンプレートの宣言の仕方は3通りあります。

### 1. script要素で宣言

上の「シンプルな使用例」で利用している方法です。
script 要素に data-template 属性を付与して名前をつけて宣言します。

	<script type="text/template" data-template="header">
		<h1>{{title}}</h1>
		<p>{{description}}</p>
	</script>

### 2. JavaScript内で宣言

Vix.template() でテンプレートを事前にコンパイルして管理しておけます。

	Vix.template({
		header: '\
			<h1>{{title}}</h1>\
			<p>{{description}}</p>\
		'
	});

### 3. Ajaxで取得

1, 2 いずれの方法でも追加されていないテンプレートは、自動的にAjaxで取得しようと試みます。
Vix.config() で `templatePath` と `templateExt` を設定してファイルを探索する場所を指定できます。

	Vix.config({
		templatePath: "/assets/templates",
		templateExt: ".html"
	});

## APIの宣言

テンプレートに値を渡す為の関数をここで「API」と呼んでいます。
APIの宣言は、config() でオブジェクトを指定しておこないます。

	var myAPI = {
		header: function(){ ... }
	};

	Vix.config({
		api: myAPI
	});

api のデフォルト値は `window` です。
config() で何も設定をおこなわなかった場合は、グローバル空間から関数を探します。（ドットシンタックスが利用可能です）

	<div data-view="header" data-api="app.api.header"></div>

	<script>
	var app = {
		api: {
			header: function(){ ... }
		}
	};
	</script>

### 返り値

APIの返り値は、プレーンなオブジェクトか、Deferred オブジェクトが使えます。
Deferred オブジェクト同様に、$.ajax() の返り値をそのまま渡す事ができます。

	// オブジェクトを返す
	api.header = function(){
		return {
			title: "Hello, World !",
			description: "ホームページへようこそ"
		}
	};

	// $.ajax() を返す
	api.profile = function(){
		return $.getJSON("/api/me");
	};

	// $.Deferred() を返す
	api.article = function(){
		var df = $.Deferred()
		$.ajax({
			url: "/api/article",
			data: {id: 123}
			dataType: "json"
		})
		.done(function(data){
			data.updated = (new Date(data.updated)).toLocaleString();
			df.resolve(data);
		});
		return df.promise();
	};


## 再描画とオーバーライド

一度描画完了したパーツを再描画するには、`Vix.refresh()` を使用します。
引数にはビュー（テンプレート）の名前を渡します。
何も渡さなかった場合は、全てのパーツを再描画します。

	Vix.refresh("header");

### 値のオーバーライド

`Vix.refresh()` の第二引数で、テンプレートに渡す値をオーバーライドして描画する事ができます。
ここで渡す値は、APIが返す値より優先されます。

	Vix.refresh("header", {
		title: "Lorem Ipsum"
	});

