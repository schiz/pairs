var Game = new ( Backbone.View.extend({
	
	Models: {},
	Views: {},
	Instances: {},

	events: {
		'click a' : 'resetDefault',
		'click a[data-type="outerLink"]': 'outerLinkHandler'		
	},
	resetDefault: function(e){	
		e.preventDefault();
	},
	outerLinkHandler: function(e){
		document.location.href = $(e.currentTarget).attr('href');
	},
	initialize: function(){		
		this.setElement('body');
		if (navigator.appVersion.indexOf("Win")!=-1) $('html').addClass("win");	
		if (navigator.appVersion.indexOf("MSIE 10")!=-1) $('html').addClass("ie10");

		if(!Modernizr.csstransforms3d) $('html').addClass('no-animation')
	},	
	start: function(){
		Game.Instances.startScreen = new Game.Views.Startscreen;
		Game.Instances.gameField = new Game.Views.Field;
	}	
}))()

/* startScreen */
Game.Views.Startscreen = Backbone.View.extend({
	events: {
		'click .start-btn'   :  'startGame',
		'click .rules-btn'   :  'showRules',		
	},
	initialize: function(){
		this.setElement('.start-screen');		
	},
	startGame: function(){		
		this.$el.fadeOut('200',function(){					
			Game.Instances.gameField.startGame();
			Game.Instances.gameField.startTimer();			
		})
	},
	showRules: function(){		
		this.$el.fadeOut('100',function(){

			if (!Game.Instances.rules) {				
				 Game.Instances.rules = new Game.Views.Rules;
				 Game.Instances.rules.$el.fadeIn('200');		
			}
			else {
				Game.Instances.rules.show();				
			}	
		})

	}	
});

/* rules */

Game.Views.Rules = Backbone.View.extend({
	events: {},
	initialize: function(){
		this.setElement('.rules-screen');		
		this.render();
	},
	show: function(){
		var self = this;

		this.$el.modal({
	    	onClose: function(rules){	    		
	    		self.$el.fadeOut(200,function(){
		    		$.modal.close();		    		
		    		Game.Instances.startScreen.$el.fadeIn(200);
	    		})	    		
	    	}
    	});

	},
	render: function(){	
		var self = this;

    	this.$el.modal({
	    	onClose: function(){
	    		self.$el.fadeOut(200,function(){
		    		$.modal.close();
		    		Game.Instances.startScreen.$el.fadeIn(200);
	    		})	    		
	    	},
	    	onShow: function(rules) {
	    		$(rules).fadeIn(200,function(){	    			
	    			self.$el.find('.rules-text').jScrollPane({	    				
	    				autoReinitialise: true,
	    			});	    			
	    		});
	    	}
    	});
	}
})


/* gameField */

Game.Models.Field = Backbone.Model.extend({
	defaults: {}
})

Game.Views.Field = Backbone.View.extend({
	events: {
		
	},
	
	timer: false,

	userResult: {
		seconds: 0,
		errors: 0
	},	
	
	showResultPage: function(userResult){		
		this.$el.fadeOut('100',function(){
		 	if (!Game.Instances.result) {			
				 Game.Instances.result = new Game.Views.Result(userResult);
				 Game.Instances.result.$el.fadeIn('200');
		 	} else {
		 		 Game.Instances.result.$el.fadeIn('200');
		 	}
		})
	},
	initialize: function(){		
		this.setElement('.game-screen');				
		//this.startGame();		
	},	
	startGame: function(){
		var self = this;
		
		if (this.userResult.errors > 0) this.clearErrors();

		this.$el.fadeIn('200');
		
	},	
	
	clearErrors: function(){		
		this.$el.find('.clicksCount #clicks').html(this.userResult.clicks = 0);

	},
	shuffle: function(o){		
	    for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	    return o;
	},
	startTimer: function(){
		if (this.timer) {
			clearInterval(this.timer);
			this.userResult.seconds = 0;
			this.$el.find('.timer').html('0:00');
		} 

		var self = this;

		this.timer = setInterval(function(){
			self.$el.find('.timer').html(self.formatTime(self.userResult.seconds += 1));
				
		},1000);
	},
	formatTime: function(seconds){
		var d = Number(seconds),
			h = Math.floor(d / 3600),
			m = Math.floor(d % 3600 / 60),
			s = Math.floor(d % 3600 % 60);

		return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s); 
	}
});

Game.Views.Result = Backbone.View.extend({
	events: {
		'click #playAgain' : 'restartGame',
		'click .saveBtn' : 'save',		
	},

	started: false,
	encryptKey: false,

	initialize: function(userResult){
		this.setElement('.result-screen');
		this.getKey();
		this.userResult = userResult;
		this.on('saved failed',this.showResult);		
		this.render();
	},
	getKey: function(){
		var self = this;
		$.get('ajax/gamestore.php',{action:'getkey'}, 	function(data) {					
			response = JSON.parse(data);			
  			response.res === 1 ? self.encryptKey = response.data : console.log('error. Key not recieved');  //сделал console.log как обработчик ошибки. Можно менять на что угодно
		 });
	},
	restartGame: function(){		
		Game.Instances.gameField.startGame();		
	},
	save: function(){
		var stringToEncrypt = 'clicks: ' + this.userResult.clicks + ',seconds: ' + this.userResult.seconds + '#',
			codedData = new Blowfish(this.encryptKey).encrypt(stringToEncrypt),
			self = this,
			response;

		$.post('ajax/gamestore.php', 
			{ 
				have_code: "1", //для совместимости с gamestore.php
				action: 'store',
				data: codedData
			}, 
			function(data) {						
				response = JSON.parse(data);			
				if (response.res === 0 && response.data.length > 0 ) {
					document.location.href = response.data;
				} else if (response.res === 1) {
					 self.trigger('saved',{saved: true});				
				  } 	  			
		    }
		);
	},
	showResult: function(e){				
		this.$el.fadeOut('100',function(){				
			Game.Instances.saveResult = new Game.Views.SaveResult(e);
			Game.Instances.saveResult.$el.fadeIn('200');			
		})
	},	
	render: function(){	
		this.$el.find('.seconds span').html(this.userResult.seconds);
		this.$el.find('.clicks span').html(this.userResult.clicks);    	
	}
})
Game.Views.SaveResult = Backbone.View.extend({
	events: {
		'click .backToGame' : 'backToGame'
	},
	initialize: function(e){
		this.setElement('.save-result')
		this.isSaved = e.saved;
		this.render();		
	},
	backToGame: function(){	
		this.$el.fadeOut('100',function(){			
			$.modal.close();			
			Game.Instances.startScreen.$el.fadeIn('100');

		})
	},
	render: function(){		
		this.$el.modal({closeClass:'saveCloseImg'});		
	}
})



jQuery(document).ready(function($) {
	Game.start();
});
